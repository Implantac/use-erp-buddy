-- Create product formulas table (BOM - Bill of Materials)
CREATE TABLE public.product_formulas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, name)
);

-- Create formula items
CREATE TABLE public.formula_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    formula_id UUID NOT NULL REFERENCES public.product_formulas(id) ON DELETE CASCADE,
    component_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity NUMERIC(15,4) NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create production orders
CREATE TYPE public.production_order_status AS ENUM ('draft', 'planned', 'in_production', 'completed', 'cancelled');

CREATE TABLE public.production_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    formula_id UUID NOT NULL REFERENCES public.product_formulas(id) ON DELETE CASCADE,
    target_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    status public.production_order_status DEFAULT 'draft',
    quantity_target NUMERIC(15,4) NOT NULL CHECK (quantity_target > 0),
    quantity_produced NUMERIC(15,4) DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS & Grants
ALTER TABLE public.product_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formula_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_formulas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.formula_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_orders TO authenticated;

GRANT ALL ON public.product_formulas TO service_role;
GRANT ALL ON public.formula_items TO service_role;
GRANT ALL ON public.production_orders TO service_role;

-- Policies (simplified per-tenant)
CREATE POLICY "Tenants can manage their own formulas" ON public.product_formulas
    FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Tenants can manage their formula items" ON public.formula_items
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.product_formulas f 
            WHERE f.id = formula_id AND f.tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY "Tenants can manage their production orders" ON public.production_orders
    FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
