-- Create departments table
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create job_positions table
CREATE TABLE public.job_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    department_id UUID REFERENCES public.departments(id),
    title TEXT NOT NULL,
    base_salary NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create employees table
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    profile_id UUID REFERENCES public.profiles(id),
    company_id UUID REFERENCES public.companies(id),
    unit_id UUID REFERENCES public.units(id),
    department_id UUID REFERENCES public.departments(id),
    job_position_id UUID REFERENCES public.job_positions(id),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    document_number TEXT,
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    termination_date DATE,
    salary NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'terminated')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payroll_records table
CREATE TABLE public.payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES public.employees(id),
    transaction_id UUID REFERENCES public.transactions(id),
    period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year INTEGER NOT NULL,
    base_salary NUMERIC(15, 2) NOT NULL,
    additions NUMERIC(15, 2) DEFAULT 0,
    deductions NUMERIC(15, 2) DEFAULT 0,
    net_salary NUMERIC(15, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Enable
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_positions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_records TO authenticated;
GRANT ALL ON public.departments TO service_role;
GRANT ALL ON public.job_positions TO service_role;
GRANT ALL ON public.employees TO service_role;
GRANT ALL ON public.payroll_records TO service_role;

-- Policies
CREATE POLICY "Tenant isolation for departments" ON public.departments FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM user_roles WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "Tenant isolation for job_positions" ON public.job_positions FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM user_roles WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "Tenant isolation for employees" ON public.employees FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM user_roles WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "Tenant isolation for payroll_records" ON public.payroll_records FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM user_roles WHERE user_id = auth.uid() LIMIT 1));
