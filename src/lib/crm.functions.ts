import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { logAudit } from "./audit.server";


const getCustomersSchema = z.object({
  search: z.string().optional(),
  active: z.boolean().optional(),
}).optional();

export const getCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => getCustomersSchema.parse(data))
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("customers" as any)
      .select("*")
      .order("name", { ascending: true });

    if (data?.search) {
      query = (query as any).ilike("name", `%${data.search}%`);
    }
    if (data?.active !== undefined) {
      query = (query as any).eq("active", data.active);
    }

    const { data: customers, error } = await query;
    if (error) throw error;
    return customers as any[];
  });

export const createCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => z.object({
    tenant_id: z.string().uuid(),
    name: z.string().min(2),
    document: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("customers" as any).insert(data as any);
    if (error) throw new Error(error.message);

    // Log Audit
    await logAudit(context.supabase, {
      tenant_id: data.tenant_id,
      user_id: context.userId,
      action: 'insert',
      entity_name: 'customers',
      new_data: data
    });

    return { success: true };
  });

export const updateCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => z.object({
    id: z.string().uuid(),
    name: z.string().min(2).optional(),
    document: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    active: z.boolean().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { id, ...updates } = data;
    const { error } = await context.supabase.from("customers" as any).update(updates as any).eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
