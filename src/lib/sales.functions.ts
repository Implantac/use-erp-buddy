import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getSales = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: { limit?: number } | undefined) => z.object({
    limit: z.number().default(50),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: sales, error } = await context.supabase
      .from("sales" as any)
      .select("*, customers(name)")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (error) throw error;
    return sales as any[];
  });

export const createSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({
    tenant_id: z.string().uuid(),
    customer_id: z.string().uuid().optional(),
    items: z.array(z.object({
      product_id: z.string().uuid(),
      quantity: z.number().positive(),
      unit_price: z.number().positive(),
    })).min(1),
    discount_amount: z.number().default(0),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const total_amount = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const final_amount = total_amount - data.discount_amount;

    // 1. Create Sale Header
    const { data: sale, error: saleError } = await context.supabase
      .from("sales" as any)
      .insert({
        tenant_id: data.tenant_id,
        customer_id: data.customer_id,
        status: 'completed',
        total_amount,
        discount_amount: data.discount_amount,
        final_amount,
      } as any)
      .select()
      .single();

    if (saleError) throw new Error(saleError.message);

    // 2. Create Sale Items
    const saleItems = data.items.map(item => ({
      sale_id: sale.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await context.supabase
      .from("sale_items" as any)
      .insert(saleItems as any);

    if (itemsError) throw new Error(itemsError.message);

    // 3. Register Inventory Transactions & Update Stock
    for (const item of data.items) {
      // Record movement
      await context.supabase.from("inventory_transactions" as any).insert({
        tenant_id: data.tenant_id,
        product_id: item.product_id,
        type: 'out',
        quantity: item.quantity,
        notes: `Venda #${sale.id.slice(0, 8)}`,
        unit_id: (await context.supabase.from("units" as any).select("id").eq("tenant_id", data.tenant_id).limit(1).single()).data?.id // Simplified: pick first unit
      } as any);

      // Update aggregate (in a real app, use a DB trigger, but for now manual update)
      const { data: product } = await context.supabase.from("products").select("stock_quantity").eq("id", item.product_id).single();
      if (product) {
        await context.supabase.from("products").update({ 
          stock_quantity: (product.stock_quantity || 0) - item.quantity 
        }).eq("id", item.product_id);
      }
    }

    // 4. Create Financial Transaction
    const { error: financeError } = await context.supabase.from("transactions").insert({
      tenant_id: data.tenant_id,
      type: 'income',
      amount: final_amount,
      description: `Venda #${sale.id.slice(0, 8)}`,
      status: 'completed',
      category: 'Vendas'
    } as any);

    if (financeError) console.error("Failed to create financial transaction:", financeError);

    return { success: true, saleId: sale.id };
  });
