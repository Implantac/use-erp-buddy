-- Phase 15: Automations & Notifications

-- 1. Automation Rules
CREATE TABLE public.automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    entity_type TEXT NOT NULL, -- 'product', 'sale', 'purchase_order', etc.
    event_type TEXT NOT NULL, -- 'insert', 'update', 'delete'
    condition_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    action_type TEXT NOT NULL, -- 'notification', 'email', 'webhook', 'create_record'
    action_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. System Notifications
CREATE TABLE public.system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Workflow Triggers Log
CREATE TABLE public.workflow_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    rule_id UUID REFERENCES public.automation_rules(id) ON DELETE SET NULL,
    status TEXT NOT NULL, -- 'success', 'failed'
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS & Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_rules TO authenticated;
GRANT ALL ON public.automation_rules TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_notifications TO authenticated;
GRANT ALL ON public.system_notifications TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_logs TO authenticated;
GRANT ALL ON public.workflow_logs TO service_role;

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_logs ENABLE ROW LEVEL SECURITY;

-- Basic isolation policies
CREATE POLICY "Users can manage their tenant's automation rules" 
ON public.automation_rules FOR ALL TO authenticated 
USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can see their tenant's notifications" 
ON public.system_notifications FOR SELECT TO authenticated 
USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can see their tenant's workflow logs" 
ON public.workflow_logs FOR SELECT TO authenticated 
USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));