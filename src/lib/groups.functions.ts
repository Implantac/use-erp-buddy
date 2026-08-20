import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const groupSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  tenant_id: z.string().uuid(),
});

export const getMyGroups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("organization_groups")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data;
  });

export const createGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => groupSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: group, error } = await context.supabase
      .from("organization_groups")
      .insert({
        name: data.name,
        tenant_id: data.tenant_id,
      })
      .select()
      .single();

    if (error) throw error;
    return group;
  });

export const deleteGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("organization_groups")
      .delete()
      .eq("id", data.id);

    if (error) throw error;
    return { success: true };
  });
