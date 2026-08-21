import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { logAudit } from "./audit.server";

const getSuppliersSchema = z.object({
  search: z.string().optional(),
}).optional();

export const getSuppliers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => getSuppliersSchema.parse(data))
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("suppliers")
      .select("*")
      .order("name", { ascending: true });

    if (data?.search) {
      query = query.ilike("name", `%${data.search}%`);
    }

    const { data: suppliers, error } = await query;
    if (error) throw error;
    return suppliers as any[];
  });

export const createSupplier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => z.object({
    tenant_id: z.string().uuid(),
    name: z.string().min(2, "Nome é obrigatório"),
    tax_id: z.string().optional(),
    email: z.string().email("E-mail inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("suppliers").insert(data);
    if (error) throw new Error(error.message);

    await logAudit(context.supabase, {
      tenant_id: data.tenant_id,
      user_id: context.userId,
      action: 'insert',
      entity_name: 'suppliers',
      new_data: data
    });

    return { success: true };
  });

export const updateSupplier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => z.object({
    id: z.string().uuid(),
    updates: z.object({
      name: z.string().min(2).optional(),
      tax_id: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().optional(),
      address: z.string().optional(),
    }),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { id, updates } = data;
    const { error } = await context.supabase.from("suppliers").update(updates).eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
