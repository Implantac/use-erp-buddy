import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Busca contagens em paralelo
    const [companiesRes, unitsRes, groupsRes, teamRes] = await Promise.all([
      context.supabase.from("companies").select("*", { count: "exact", head: true }),
      context.supabase.from("units").select("*", { count: "exact", head: true }),
      context.supabase.from("organization_groups").select("*", { count: "exact", head: true }),
      context.supabase.from("user_roles").select("*", { count: "exact", head: true }),
    ]);

    return {
      companies: companiesRes.count || 0,
      units: unitsRes.count || 0,
      groups: groupsRes.count || 0,
      team: teamRes.count || 0,
    };
  });
