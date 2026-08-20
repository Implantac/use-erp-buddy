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
      .insert(data)
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
    const { data: company, error } = await context.supabase
      .from("companies")
      .update(data.updates)
      .eq("id", data.id)
      .select()
      .single();

    if (error) throw error;
    return company;
  });
