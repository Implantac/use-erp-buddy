import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const companySchema = z.object({
  name: z.string().min(2),
  legal_name: z.string().nullable().optional(),
  tax_id: z.string().nullable().optional(),
  group_id: z.string().uuid().nullable().optional(),
  tenant_id: z.string().uuid(),
});

export const getMyCompanies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("companies")
      .select("*, organization_groups(name)")
      .eq("is_active", true);

    if (error) throw error;
    return data;
  });

export const createCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => companySchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: company, error } = await context.supabase
      .from("companies")
      .insert({
        name: data.name,
        legal_name: data.legal_name ?? null,
        tax_id: data.tax_id ?? null,
        group_id: data.group_id ?? null,
        tenant_id: data.tenant_id,
      })
      .select()
      .single();

    if (error) throw error;
    return company;
  });

export const updateCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({
    id: z.string().uuid(),
    updates: companySchema.partial(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const updates: any = { ...data.updates };
    if ('legal_name' in updates && updates.legal_name === undefined) updates.legal_name = null;
    if ('tax_id' in updates && updates.tax_id === undefined) updates.tax_id = null;
    if ('group_id' in updates && updates.group_id === undefined) updates.group_id = null;

    const { data: company, error } = await context.supabase
      .from("companies")
      .update(updates)
      .eq("id", data.id)
      .select()
      .single();

    if (error) throw error;
    return company;
  });
