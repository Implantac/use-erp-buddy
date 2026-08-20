import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyTenants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Busca tenants onde o usuário tem um papel
    const { data: roles, error: rolesError } = await context.supabase
      .from("user_roles")
      .select("tenant_id")
      .eq("user_id", context.userId);

    if (rolesError) throw rolesError;
    if (!roles || roles.length === 0) return [];

    const tenantIds = roles.map(r => r.tenant_id);

    const { data, error } = await context.supabase
      .from("tenants")
      .select("*")
      .in("id", tenantIds)
      .eq("is_active", true);

    if (error) throw error;
    return data;
  });
