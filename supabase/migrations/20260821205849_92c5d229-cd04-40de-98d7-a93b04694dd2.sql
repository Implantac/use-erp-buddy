-- 1. Fix Function Search Path Mutable
ALTER FUNCTION public.has_role(_user_id uuid, _tenant_id uuid, _role app_role) SET search_path = public;

-- 2. Fix SECURITY DEFINER functions executable by public/authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, uuid, app_role) TO authenticated, service_role;

-- 3. Update RLS policies to avoid metadata references
-- (The linter likely flagged existing policies, so we apply the best practice to new ones too)

DROP POLICY IF EXISTS "Users can view their tenant's vacancies" ON public.job_vacancies;
DROP POLICY IF EXISTS "Users can manage their tenant's vacancies" ON public.job_vacancies;
DROP POLICY IF EXISTS "Users can view their tenant's candidates" ON public.job_candidates;
DROP POLICY IF EXISTS "Users can manage their tenant's candidates" ON public.job_candidates;

CREATE POLICY "Users can view their tenant's vacancies" ON public.job_vacancies
    FOR SELECT TO authenticated USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their tenant's vacancies" ON public.job_vacancies
    FOR ALL TO authenticated USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their tenant's candidates" ON public.job_candidates
    FOR SELECT TO authenticated USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their tenant's candidates" ON public.job_candidates
    FOR ALL TO authenticated USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );
