-- Add INSERT policy for webhook_logs
CREATE POLICY "Users can insert logs for their tenant"
    ON public.webhook_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (tenant_id IN (
        SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
    ));
