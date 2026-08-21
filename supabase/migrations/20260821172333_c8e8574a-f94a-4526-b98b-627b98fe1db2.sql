-- Create carriers table
CREATE TABLE public.carriers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    tax_id text,
    email text,
    phone text,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Shipping methods
CREATE TABLE public.shipping_methods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    estimated_days integer,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Shipments vinculados a vendas
CREATE TABLE public.shipments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    sale_id uuid NOT NULL,
    carrier_id uuid REFERENCES public.carriers(id),
    shipping_method_id uuid REFERENCES public.shipping_methods(id),
    tracking_code text,
    status text NOT NULL DEFAULT 'pending', -- pending, shipped, delivered, returned
    shipped_at timestamptz,
    delivered_at timestamptz,
    estimated_delivery timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Delivery logs
CREATE TABLE public.delivery_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    shipment_id uuid REFERENCES public.shipments(id) ON DELETE CASCADE,
    status text NOT NULL,
    location text,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carriers TO authenticated;
GRANT ALL ON public.carriers TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipping_methods TO authenticated;
GRANT ALL ON public.shipping_methods TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipments TO authenticated;
GRANT ALL ON public.shipments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_logs TO authenticated;
GRANT ALL ON public.delivery_logs TO service_role;

-- RLS
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their tenant's carriers" ON public.carriers
    FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "Users can only access their tenant's shipping_methods" ON public.shipping_methods
    FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "Users can only access their tenant's shipments" ON public.shipments
    FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "Users can only access their tenant's delivery_logs" ON public.delivery_logs
    FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1));
