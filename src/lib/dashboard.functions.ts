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

    // Get user roles to determine scope
    const { data: userRole } = await context.supabase
      .from("user_roles")
      .select("tenant_id, role, company_id, unit_id")
      .eq("user_id", context.userId)
      .limit(1)
      .single();
    
    const tid = userRole?.tenant_id;
    const isGlobalAdmin = userRole?.role === 'admin' && !userRole.company_id && !userRole.unit_id;
    
    // Override filters if user has restricted scope
    const effectiveCompanyId = isGlobalAdmin ? filters.company_id : (userRole?.company_id || filters.company_id);
    const effectiveUnitId = isGlobalAdmin ? filters.unit_id : (userRole?.unit_id || filters.unit_id);


    // Build base queries with filters
    const companiesQuery = context.supabase.from("companies").select("*", { count: "exact", head: true });
    const unitsQuery = context.supabase.from("units").select("*", { count: "exact", head: true });
    const groupsQuery = context.supabase.from("organization_groups").select("*", { count: "exact", head: true });
    const teamQuery = context.supabase.from("user_roles").select("*", { count: "exact", head: true });
    
    let financeQuery = context.supabase.from("transactions").select("type, amount");
    let salesQuery = context.supabase.from("sales" as any).select("final_amount, created_at");

    if (effectiveCompanyId) {
      (unitsQuery as any).eq("company_id", effectiveCompanyId);
      // If we filter by company, also filter other entities that belong to it
      (financeQuery as any).eq("company_id", effectiveCompanyId); 
      (salesQuery as any).eq("company_id", effectiveCompanyId);
    }
    
    if (effectiveUnitId) {
      (financeQuery as any).eq("unit_id", effectiveUnitId);
      (salesQuery as any).eq("unit_id", effectiveUnitId);
    }
    
    // Apply role-based mandatory filtering if not global admin
    if (!isGlobalAdmin) {
      if (userRole?.company_id) {
        (companiesQuery as any).eq("id", userRole.company_id);
        (teamQuery as any).eq("company_id", userRole.company_id);
      }
      if (userRole?.unit_id) {
        (unitsQuery as any).eq("id", userRole.unit_id);
      }
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
