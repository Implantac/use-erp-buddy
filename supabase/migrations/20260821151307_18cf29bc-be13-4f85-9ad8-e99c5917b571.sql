INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260821151500');
GRANT UPDATE(status) ON public.purchase_orders TO authenticated;
CREATE POLICY "Users can approve their tenant's purchase orders"
ON public.purchase_orders
FOR UPDATE
TO authenticated
USING (tenant_id IN (
    SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
))
WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
));