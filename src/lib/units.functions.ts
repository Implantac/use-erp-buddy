import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const unitSchema = z.object({
  name: z.string().min(2),
  company_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  type: z.string().min(1),
  is_active: z.boolean().optional(),
}) as z.ZodType<any>;

export const getMyUnits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("units")
      .select("*, companies(name)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });

export const createUnit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => unitSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: unit, error } = await context.supabase
      .from("units")
      .insert({
        name: data.name,
        company_id: data.company_id,
        tenant_id: data.tenant_id,
        type: data.type,
        is_active: data.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return unit;
  });

export const toggleUnitStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string; is_active: boolean }) => z.object({
    id: z.string().uuid(),
    is_active: z.boolean(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: unit, error } = await context.supabase
      .from("units")
      .update({ is_active: data.is_active })
      .eq("id", data.id)
      .select()
      .single();

    if (error) throw error;
    return unit;
  });
