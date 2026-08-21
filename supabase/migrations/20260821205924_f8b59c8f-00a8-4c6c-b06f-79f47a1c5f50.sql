-- 1. Correct RLS policies using metadata (Customers, Sales, Sale Items)
-- Replace metadata references with joins to user_roles table

DROP POLICY IF EXISTS "Users can manage customers for their tenant" ON public.customers;
CREATE POLICY "Users can manage customers for their tenant" ON public.customers
    FOR ALL TO authenticated USING (
        tenant_id IN (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can manage sales for their tenant" ON public.sales;
CREATE POLICY "Users can manage sales for their tenant" ON public.sales
    FOR ALL TO authenticated USING (
        tenant_id IN (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can manage sale items for their tenant" ON public.sale_items;
CREATE POLICY "Users can manage sale items for their tenant" ON public.sale_items
    FOR ALL TO authenticated USING (
        sale_id IN (
            SELECT id FROM public.sales 
            WHERE tenant_id IN (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid())
        )
    );

-- 2. Final attempt to clear SD executable warnings for handle_new_user and check_access
-- handle_new_user is usually for auth triggers, so it MUST be executable by service_role (or anon during signup if configured)
-- check_access is for RLS, so authenticated needs it.

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE ALL ON FUNCTION public.check_access(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_access(uuid, uuid, uuid) TO authenticated, service_role;
