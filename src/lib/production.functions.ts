import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { logAudit } from "./audit.server";

// --- Schemas ---

const createFormulaSchema = z.object({
  product_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  items: z.array(z.object({
    component_product_id: z.string().uuid(),
    quantity: z.number().positive(),
  })),
});

const createProductionOrderSchema = z.object({
  company_id: z.string().uuid(),
  unit_id: z.string().uuid(),
  formula_id: z.string().uuid(),
  target_product_id: z.string().uuid(),
  quantity_target: z.number().positive(),
  notes: z.string().nullable().optional(),
});

const finishProductionOrderSchema = z.object({
  order_id: z.string().uuid(),
  quantity_produced: z.number().positive(),
});

const updateProductionOrderStatusSchema = z.object({
  order_id: z.string().uuid(),
  status: z.enum(['planned', 'in_production', 'completed', 'cancelled']),
});

// --- Functions ---

export const getProductionFormulas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("product_formulas")
      .select("*, formula_items(*, products:component_product_id(name, unit_of_measure)), products:product_id(name)")
      .eq("is_active", true);
    
    if (error) throw error;
    return data;
  });

export const createProductionFormula = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => createFormulaSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: roleData } = await context.supabase
      .from("user_roles")
      .select("tenant_id")
      .eq("user_id", context.userId)
      .limit(1)
      .single();

    if (!roleData?.tenant_id) throw new Error("Tenant not found");

    const { data: formula, error: formulaError } = await context.supabase
      .from("product_formulas")
      .insert({
        tenant_id: roleData.tenant_id,
        product_id: data.product_id,
        name: data.name,
        description: data.description ?? null,
      })
      .select()
      .single();

    if (formulaError) throw formulaError;

    const formulaItems = data.items.map(item => ({
      formula_id: formula.id,
      component_product_id: item.component_product_id,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await context.supabase
      .from("formula_items")
      .insert(formulaItems);

    if (itemsError) throw itemsError;

    await logAudit(context.supabase, {
      user_id: context.userId,
      tenant_id: roleData.tenant_id,
      action: "insert",
      entity_name: "product_formulas",
      entity_id: formula.id,
      new_data: data,
    });

    return formula;
  });

export const getProductionOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("production_orders")
      .select(`
        *,
        products:target_product_id(name),
        units(name),
        companies(name),
        product_formulas(name)
      `)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  });

export const createProductionOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => createProductionOrderSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: roleData } = await context.supabase
      .from("user_roles")
      .select("tenant_id")
      .eq("user_id", context.userId)
      .limit(1)
      .single();

    if (!roleData?.tenant_id) throw new Error("Tenant not found");

    const { data: order, error } = await context.supabase
      .from("production_orders")
      .insert({
        tenant_id: roleData.tenant_id,
        company_id: data.company_id,
        unit_id: data.unit_id,
        formula_id: data.formula_id,
        target_product_id: data.target_product_id,
        quantity_target: data.quantity_target,
        notes: data.notes ?? null,
        status: 'planned'
      })
      .select()
      .single();

    if (error) throw error;

    await logAudit(context.supabase, {
      user_id: context.userId,
      tenant_id: roleData.tenant_id,
      action: "insert",
      entity_name: "production_orders",
      entity_id: order.id,
      new_data: order,
    });

    return order;
  });

export const finishProductionOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => finishProductionOrderSchema.parse(data))
  .handler(async ({ data, context }) => {
    // 1. Get order and formula details
    const { data: order, error: fetchError } = await context.supabase
      .from("production_orders")
      .select("*, product_formulas(*, formula_items(*))")
      .eq("id", data.order_id)
      .single();

    if (fetchError || !order) throw new Error("Order not found");
    if (order.status === 'completed') throw new Error("Order already completed");

    const { data: roleData } = await context.supabase
      .from("user_roles")
      .select("tenant_id")
      .eq("user_id", context.userId)
      .limit(1)
      .single();

    if (!roleData?.tenant_id) throw new Error("Tenant not found");

    // 2. Process stock changes
    for (const item of (order.product_formulas as any).formula_items) {
      const consumption = Number(item.quantity) * data.quantity_produced;
      
      const { error: outError } = await context.supabase
        .from("inventory_transactions")
        .insert({
          tenant_id: roleData.tenant_id,
          unit_id: order.unit_id,
          product_id: item.component_product_id,
          type: 'out',
          quantity: consumption,
          notes: `Consumo p/ Ordem de Produção #${order.id.slice(0, 8)}`,
        });
      
      if (outError) throw outError;
    }

    // 2b. Add finished product to stock
    const { error: inError } = await context.supabase
      .from("inventory_transactions")
      .insert({
        tenant_id: roleData.tenant_id,
        unit_id: order.unit_id,
        product_id: order.target_product_id,
        type: 'in',
        quantity: data.quantity_produced,
        notes: `Produção concluída Ordem #${order.id.slice(0, 8)}`,
      });

    if (inError) throw inError;

    // 3. Update order status
    const { error: updateError } = await context.supabase
      .from("production_orders")
      .update({
        status: 'completed',
        quantity_produced: data.quantity_produced,
        end_date: new Date().toISOString()
      })
      .eq("id", data.order_id);

    if (updateError) throw updateError;

    await logAudit(context.supabase, {
      user_id: context.userId,
      tenant_id: roleData.tenant_id,
      action: "production",
      entity_name: "production_orders",
      entity_id: order.id,
      new_data: { status: 'completed', quantity_produced: data.quantity_produced },
    });

    return { success: true };
  });

export const updateProductionOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => updateProductionOrderStatusSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: roleData } = await context.supabase
      .from("user_roles")
      .select("tenant_id")
      .eq("user_id", context.userId)
      .limit(1)
      .single();

    if (!roleData?.tenant_id) throw new Error("Tenant not found");

    const updateData: any = { status: data.status };
    if (data.status === 'in_production') {
      updateData.start_date = new Date().toISOString();
    } else if (data.status === 'cancelled') {
      updateData.end_date = new Date().toISOString();
    }

    const { error } = await context.supabase
      .from("production_orders")
      .update(updateData)
      .eq("id", data.order_id);

    if (error) throw error;

    await logAudit(context.supabase, {
      user_id: context.userId,
      tenant_id: roleData.tenant_id,
      action: "production",
      entity_name: "production_orders",
      entity_id: data.order_id,
      new_data: updateData,
    });

    return { success: true };
  });
