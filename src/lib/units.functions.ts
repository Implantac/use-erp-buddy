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
  .validator((data: { 
    page?: number | undefined; 
    pageSize?: number | undefined; 
    orderBy?: string | undefined; 
    orderDirection?: 'asc' | 'desc' | undefined;
    search?: string | undefined;
    isActive?: boolean | null | undefined;
  } | undefined) => 
    z.object({
      page: z.number().int().min(1).optional().nullable(),
      pageSize: z.number().int().min(1).max(100).optional().nullable(),
      orderBy: z.string().optional().nullable(),
      orderDirection: z.enum(['asc', 'desc']).optional().nullable(),
      search: z.string().optional().nullable(),
      isActive: z.boolean().nullable().optional(),
    }).optional().parse(data)
  )
  .handler(async ({ data, context }) => {
    const page = data?.page || 1;
    const pageSize = data?.pageSize || 10;
    const orderBy = data?.orderBy || "created_at";
    const orderDirection = data?.orderDirection || "desc";
    const search = data?.search;
    const isActive = data?.isActive;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = context.supabase
      .from("units")
      .select("*, companies(name)", { count: "exact" });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (isActive !== undefined && isActive !== null) {
      query = query.eq("is_active", isActive);
    }

    const { data: units, error, count } = await query
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(from, to);

    if (error) throw error;
    return { units, count: count || 0 };
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
