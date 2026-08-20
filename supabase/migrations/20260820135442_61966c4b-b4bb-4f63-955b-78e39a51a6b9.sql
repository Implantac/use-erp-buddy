-- Phase 1: Organizational Database (Core)
-- This migration sets up the fundamental multi-tenant structure for Use ERP.

-- 1. Create app_role enum for RBAC
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user', 'viewer');

-- 2. Tenants table (Root of isolation)
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 3. User Roles (RBAC with Tenant scope)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'user',
    UNIQUE (user_id, tenant_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Now we can add the policy for tenants
CREATE POLICY "Users can view their own tenant"
    ON public.tenants
    FOR SELECT
    TO authenticated
    USING (id IN (
        SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
    ));

-- 4. Organization Groups (Optional grouping of companies)
CREATE TABLE public.organization_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_groups TO authenticated;
GRANT ALL ON public.organization_groups TO service_role;

ALTER TABLE public.organization_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for organization_groups"
    ON public.organization_groups
    FOR ALL
    TO authenticated
    USING (tenant_id IN (
        SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
    ));

-- 5. Companies (Legal entities)
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.organization_groups(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    legal_name TEXT,
    tax_id TEXT, -- CNPJ/Tax Number
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for companies"
    ON public.companies
    FOR ALL
    TO authenticated
    USING (tenant_id IN (
        SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
    ));

-- 6. Units (Branches, Stores, Factories)
CREATE TABLE public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'branch', 'factory', 'warehouse', 'store'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.units TO authenticated;
GRANT ALL ON public.units TO service_role;

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for units"
    ON public.units
    FOR ALL
    TO authenticated
    USING (tenant_id IN (
        SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
    ));

-- 7. Security Definer Function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _tenant_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND role = _role
  )
$$;

-- 8. Profiles (Public user data)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- 9. Profile trigger on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Audit Logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    entity_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for audit_logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (tenant_id IN (
        SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
    ));
