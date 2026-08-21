INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260821153000');
ALTER TABLE public.inventory_transactions ADD COLUMN destination_unit_id uuid REFERENCES public.units(id);
GRANT ALL ON public.inventory_transactions TO authenticated;
GRANT ALL ON public.inventory_transactions TO service_role;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage inventory transactions for their tenant" ON public.inventory_transactions;
CREATE POLICY "Users can manage inventory transactions for their tenant"
ON public.inventory_transactions
FOR ALL
TO authenticated
USING (tenant_id IN (
    SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
))
WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
));