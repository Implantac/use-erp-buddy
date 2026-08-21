import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { logAudit } from "./audit.server";

export const getPurchaseOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => z.object({
    status: z.string().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("purchase_orders")
      .select("*, suppliers(name)")
      .order("created_at", { ascending: false });

    if (data.status) {
      query = query.eq("status", data.status);
    }

    const { data: orders, error } = await query;
    if (error) throw error;
    return orders as any[];
  });

export const createPurchaseOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => z.object({
    tenant_id: z.string().uuid(),
    supplier_id: z.string().uuid(),
    items: z.array(z.object({
      product_id: z.string().uuid(),
      quantity: z.number().positive(),
      unit_price: z.number().min(0),
    })),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const total_amount = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    // 1. Create Purchase Order
    const { data: order, error: orderError } = await context.supabase
      .from("purchase_orders")
      .insert({
        tenant_id: data.tenant_id,
        supplier_id: data.supplier_id,
        status: 'waiting_approval',
        total_amount,
      } as any)
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Create Purchase Items
    const itemsToInsert = data.items.map(item => ({
      purchase_order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await context.supabase
      .from("purchase_items")
      .insert(itemsToInsert as any);

    if (itemsError) throw itemsError;

    await logAudit(context.supabase, {
      tenant_id: data.tenant_id,
      user_id: context.userId,
      action: 'insert',
      entity_name: 'purchase_orders',
      entity_id: order.id,
      new_data: { order, items: data.items }
    });

    return { success: true, orderId: order.id };
  });

export const approvePurchaseOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => z.object({
    order_id: z.string().uuid(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: order, error: fetchError } = await context.supabase
      .from("purchase_orders")
      .select("*")
      .eq("id", data.order_id)
      .single();

    if (fetchError || !order) throw new Error("Order not found");
    if (order.status !== 'waiting_approval') throw new Error("Order is not waiting for approval");

    const { error: updateError } = await context.supabase
      .from("purchase_orders")
      .update({ status: 'pending' } as any)
      .eq("id", data.order_id);

    if (updateError) throw updateError;

    await logAudit(context.supabase, {
      tenant_id: order.tenant_id,
      user_id: context.userId,
      action: 'approve',
      entity_name: 'purchase_orders',
      entity_id: data.order_id,
      new_data: { status: 'pending', approved_by: context.userId }
    });


    return { success: true };
  });

export const receivePurchaseOrder = createServerFn({ method: "POST" })

  .middleware([requireSupabaseAuth])
  .validator((data: any) => z.object({
    order_id: z.string().uuid(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    // 1. Get Order and Items
    const { data: order, error: orderError } = await context.supabase
      .from("purchase_orders")
      .select("*, purchase_items(*)")
      .eq("id", data.order_id)
      .single();

    if (orderError || !order) throw new Error("Order not found");
    if (order.status === 'received') throw new Error("Order already received");

    const items = (order as any).purchase_items;

    // 2. Update Stock for each product
    for (const item of items) {
      // Get current stock
      const { data: product } = await context.supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", item.product_id)
        .single();
      
      const newStock = (product?.stock_quantity || 0) + item.quantity;

      await context.supabase
        .from("products")
        .update({ stock_quantity: newStock } as any)
        .eq("id", item.product_id);
      
      // Log inventory transaction
      await context.supabase.from("inventory_transactions" as any).insert({
        tenant_id: order.tenant_id,
        product_id: item.product_id,
        type: 'in',
        quantity: item.quantity,
        reason: `Purchase Order ${order.id.slice(0, 8)}`
      } as any);
    }

    // 3. Create Finance Transaction (Expense)
    await context.supabase.from("transactions").insert({
      tenant_id: order.tenant_id,
      type: 'expense',
      amount: order.total_amount,
      description: `Pagamento Compra #${order.id.slice(0, 8)}`,
      category: 'Compras/Suprimentos',
      date: new Date().toISOString()
    } as any);

    // 4. Update Order Status
    await context.supabase
      .from("purchase_orders")
      .update({ status: 'received' } as any)
      .eq("id", data.order_id);

    await logAudit(context.supabase, {
      tenant_id: order.tenant_id,
      user_id: context.userId,
      action: 'update',
      entity_name: 'purchase_orders',
      entity_id: data.order_id,
      new_data: { status: 'received' }
    });

    return { success: true };
  });
