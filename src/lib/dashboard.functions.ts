import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Busca contagens e saldos em paralelo
    const [companiesRes, unitsRes, groupsRes, teamRes, financeRes, stockAlertsRes] = await Promise.all([
      context.supabase.from("companies").select("*", { count: "exact", head: true }),
      context.supabase.from("units").select("*", { count: "exact", head: true }),
      context.supabase.from("organization_groups").select("*", { count: "exact", head: true }),
      context.supabase.from("user_roles").select("*", { count: "exact", head: true }),
      context.supabase.from("transactions").select("type, amount"),
      context.supabase.rpc('get_low_stock_count'),
    ]);

    const summary = (financeRes.data || []).reduce((acc, curr) => {
      if (curr.type === 'income') acc.income += Number(curr.amount);
      else acc.expense += Number(curr.amount);
      return acc;
    }, { income: 0, expense: 0 });

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
      stockAlerts: stockAlertsRes.data || 0
    };
  });
