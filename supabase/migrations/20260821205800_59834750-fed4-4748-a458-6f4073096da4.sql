-- Check if types and tables exist before creating
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
    END IF;
END $$;

-- Recruitment module tables
CREATE TABLE IF NOT EXISTS public.job_vacancies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    requirements text,
    salary_range text,
    status text DEFAULT 'open' CHECK (status IN ('open', 'closed', 'on_hold')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_candidates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    vacancy_id uuid REFERENCES public.job_vacancies(id) ON DELETE CASCADE NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text,
    resume_url text,
    status text DEFAULT 'applied' CHECK (status IN ('applied', 'reviewing', 'interviewing', 'hired', 'rejected')),
    created_at timestamptz DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_vacancies TO authenticated;
GRANT ALL ON public.job_vacancies TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_candidates TO authenticated;
GRANT ALL ON public.job_candidates TO service_role;

-- RLS
ALTER TABLE public.job_vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_candidates ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist to avoid errors on retry
DROP POLICY IF EXISTS "Users can view their tenant's vacancies" ON public.job_vacancies;
DROP POLICY IF EXISTS "Users can manage their tenant's vacancies" ON public.job_vacancies;
DROP POLICY IF EXISTS "Users can view their tenant's candidates" ON public.job_candidates;
DROP POLICY IF EXISTS "Users can manage their tenant's candidates" ON public.job_candidates;

CREATE POLICY "Users can view their tenant's vacancies" ON public.job_vacancies
    FOR SELECT TO authenticated USING (tenant_id = (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "Users can manage their tenant's vacancies" ON public.job_vacancies
    FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "Users can view their tenant's candidates" ON public.job_candidates
    FOR SELECT TO authenticated USING (tenant_id = (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "Users can manage their tenant's candidates" ON public.job_candidates
    FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1));

-- Ensure report_templates has query_sql column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_templates' AND column_name = 'query_sql') THEN
        ALTER TABLE public.report_templates ADD COLUMN query_sql text;
    END IF;
END $$;
