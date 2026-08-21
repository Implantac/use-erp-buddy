
-- CRM Opportunities Table
CREATE TABLE public.crm_opportunities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    value numeric(15,2) DEFAULT 0,
    stage text NOT NULL CHECK (stage IN ('lead', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
    probability integer DEFAULT 0,
    expected_closing_date timestamp with time zone,
    assigned_to uuid REFERENCES public.profiles(id),
    status text DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_opportunities TO authenticated;
GRANT ALL ON public.crm_opportunities TO service_role;

ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access opportunities of their tenant"
ON public.crm_opportunities
FOR ALL
TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- CRM Interactions Table
CREATE TABLE public.crm_interactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    opportunity_id uuid REFERENCES public.crm_opportunities(id) ON DELETE CASCADE,
    customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note')),
    description text NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL,
    performed_by uuid REFERENCES public.profiles(id) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_interactions TO authenticated;
GRANT ALL ON public.crm_interactions TO service_role;

ALTER TABLE public.crm_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access interactions of their tenant"
ON public.crm_interactions
FOR ALL
TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);
