-- Create report categories enum
DO $$ BEGIN
    CREATE TYPE public.report_category AS ENUM ('sales', 'finance', 'hr', 'logistics', 'inventory');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create report templates table
CREATE TABLE IF NOT EXISTS public.report_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    category report_category NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_templates TO authenticated;
GRANT ALL ON public.report_templates TO service_role;

ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can see templates of their tenant"
    ON public.report_templates FOR SELECT
    TO authenticated
    USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can manage templates"
    ON public.report_templates FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), tenant_id, 'admin'::public.app_role));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create report exports table
CREATE TABLE IF NOT EXISTS public.report_exports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    template_id uuid REFERENCES public.report_templates(id) ON DELETE SET NULL,
    name text NOT NULL,
    format text NOT NULL, -- 'csv', 'pdf'
    status text DEFAULT 'pending' NOT NULL, -- 'pending', 'processing', 'completed', 'failed'
    file_path text,
    filters jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_exports TO authenticated;
GRANT ALL ON public.report_exports TO service_role;

ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can see their own exports"
    ON public.report_exports FOR SELECT
    TO authenticated
    USING (profile_id = auth.uid());
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Insert some default templates for existing tenants
INSERT INTO public.report_templates (tenant_id, name, description, category, config)
SELECT 
    t.id, 
    'Vendas por Período', 
    'Relatório detalhado de todas as vendas realizadas dentro de um intervalo de datas.', 
    'sales',
    '{"fields": ["id", "created_at", "total_amount", "status"], "group_by": "day"}'::jsonb
FROM public.tenants t
ON CONFLICT DO NOTHING;

INSERT INTO public.report_templates (tenant_id, name, description, category, config)
SELECT 
    t.id, 
    'Fluxo de Caixa Mensal', 
    'Resumo de entradas e saídas financeiras por mês.', 
    'finance',
    '{"fields": ["type", "amount", "description", "date"], "group_by": "month"}'::jsonb
FROM public.tenants t
ON CONFLICT DO NOTHING;

INSERT INTO public.report_templates (tenant_id, name, description, category, config)
SELECT 
    t.id, 
    'Performance de Expedição', 
    'Métricas de entrega e performance de transportadoras.', 
    'logistics',
    '{"fields": ["carrier", "status", "delivery_time"], "metrics": ["avg_delivery_days"]}'::jsonb
FROM public.tenants t
ON CONFLICT DO NOTHING;
