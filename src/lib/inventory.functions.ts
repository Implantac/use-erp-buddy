import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getInventoryHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: { productId?: string; unitId?: string; limit?: number } | undefined) => z.object({
    productId: z.string().uuid().optional(),
    unitId: z.string().uuid().optional(),
    limit: z.number().default(50),
  }).parse(data))
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("inventory_transactions" as any)
      .select("*, products(name), units(name)")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.productId) {
      query = (query as any).eq("product_id", data.productId);
    }
    if (data.unitId) {
      query = (query as any).eq("unit_id", data.unitId);
    }

    const { data: history, error } = await query;
    if (error) throw error;
    return history as any[];
  });

export const createInventoryTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => z.object({
    product_id: z.string().uuid(),
    unit_id: z.string().uuid(),
    type: z.enum(["in", "out", "adjustment", "transfer"]),
    quantity: z.number(),
    notes: z.string().optional(),
    tenant_id: z.string().uuid(),
    destination_unit_id: z.string().uuid().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    // Permission check: Can user access origin unit?
    const { data: canAccessOrigin } = await context.supabase.rpc('check_access', { 
      _user_id: context.userId, 
      _unit_id: data.unit_id 
    });
    
    if (!canAccessOrigin) {
      throw new Error("Acesso negado à unidade de origem.");
    }

    // If transfer, check destination unit access
    if (data.type === 'transfer' && data.destination_unit_id) {
      const { data: canAccessDest } = await context.supabase.rpc('check_access', { 
        _user_id: context.userId, 
        _unit_id: data.destination_unit_id 
      });
      
      if (!canAccessDest) {
        throw new Error("Acesso negado à unidade de destino.");
      }
    }

    // If it's a transfer, we handle stock movement explicitly if needed
    const { error } = await context.supabase.from("inventory_transactions" as any).insert(data as any);

    if (error) throw new Error(error.message);

    // If it's a transfer, we should ideally also create an 'in' transaction for the destination
    if (data.type === 'transfer' && data.destination_unit_id) {
       await context.supabase.from("inventory_transactions" as any).insert({
         product_id: data.product_id,
         unit_id: data.destination_unit_id,
         type: 'in',
         quantity: data.quantity,
         notes: `Transferência recebida da unidade ${data.unit_id}. ${data.notes || ''}`,
         tenant_id: data.tenant_id
       } as any);
    }

    return { success: true };
  });


export const getStockAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: products, error } = await context.supabase
      .from("products")
      .select("id, name, stock_quantity, min_stock")
      .eq("active", true);

    if (error) throw error;
    
    // Manual filter for column comparison as standard Postgrest client doesn't support col-to-col easily
    return (products || []).filter((p: any) => (p.stock_quantity || 0) < (p.min_stock || 0));
  });
