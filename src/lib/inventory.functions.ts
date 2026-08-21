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
      .from("inventory_transactions")
      .select("*, products(name), units(name)")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.productId) {
      query = query.eq("product_id", data.productId);
    }
    if (data.unitId) {
      query = query.eq("unit_id", data.unitId);
    }

    const { data: history, error } = await query;
    if (error) throw error;
    return history;
  });

export const createInventoryTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({
    product_id: z.string().uuid(),
    unit_id: z.string().uuid(),
    type: z.enum(["in", "out", "adjustment", "transfer"]),
    quantity: z.number(),
    notes: z.string().optional(),
    tenant_id: z.string().uuid(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("inventory_transactions").insert(data as any);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getStockAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: products, error } = await context.supabase
      .from("products")
      .select("id, name, stock_quantity, min_stock")
      .lt("stock_quantity", context.supabase.raw("min_stock"))
      .eq("active", true);

    if (error) throw error;
    return products || [];
  });
