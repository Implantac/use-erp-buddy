import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { z } from "zod";

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => z.object({
    company_id: z.string().uuid().optional(),
    unit_id: z.string().uuid().optional(),
  }).parse(data))
  .handler(async ({ data: filters, context }) => {

    // Get profile to get the tenant_id
    const { data: profile } = await context.supabase
      .from("user_roles")
      .select("tenant_id")
      .eq("user_id", context.userId)
      .limit(1)
      .single();

    const tid = profile?.tenant_id;

    // Build base queries with filters
    const companiesQuery = context.supabase.from("companies").select("*", { count: "exact", head: true });
    const unitsQuery = context.supabase.from("units").select("*", { count: "exact", head: true });
    const groupsQuery = context.supabase.from("organization_groups").select("*", { count: "exact", head: true });
    const teamQuery = context.supabase.from("user_roles").select("*", { count: "exact", head: true });
    
    let financeQuery = context.supabase.from("transactions").select("type, amount");
    let salesQuery = context.supabase.from("sales" as any).select("final_amount, created_at");

    if (filters.company_id) {
      // Assuming related tables have company_id or link through units
      // For this simplified version, we'll apply filters where columns exist
      (unitsQuery as any).eq("company_id", filters.company_id);
    }

    if (filters.unit_id) {
      (financeQuery as any).eq("unit_id", filters.unit_id);
      (salesQuery as any).eq("unit_id", filters.unit_id);
    }

    // Busca contagens e saldos em paralelo
    const [companiesRes, unitsRes, groupsRes, teamRes, financeRes, salesRes, stockAlertsRes] = await Promise.all([
      companiesQuery,
      unitsQuery,
      groupsQuery,
      teamQuery,
      financeQuery,
      salesQuery,
      tid ? context.supabase.rpc('get_low_stock_count', { _tenant_id: tid }) : Promise.resolve({ data: 0, error: null }),
    ]);


    const summary = (financeRes.data || []).reduce((acc, curr) => {
      if (curr.type === 'income') acc.income += Number(curr.amount);
      else acc.expense += Number(curr.amount);
      return acc;
    }, { income: 0, expense: 0 });

    const salesTotal = ((salesRes.data as any[]) || []).reduce((sum, s) => sum + Number(s.final_amount), 0);
    const salesCount = (salesRes.data as any[])?.length || 0;
    const avgTicket = salesCount > 0 ? salesTotal / salesCount : 0;

    return {
      companies: companiesRes.count || 0,
      units: unitsRes.count || 0,
      groups: groupsRes.count || 0,
      team: teamRes.count || 0,
      finance: {
        balance: summary.income - summary.expense,
        income: summary.income,
        expense: summary.expense,
      },
      sales: {
        total: salesTotal,
        count: salesCount,
        avgTicket
      },
      stockAlerts: (stockAlertsRes as any).data || 0
    };
  });
