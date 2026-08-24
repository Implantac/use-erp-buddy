CREATE POLICY "Users can create their own exports"
ON public.report_exports
FOR INSERT
TO authenticated
WITH CHECK (
  profile_id = auth.uid()
  AND tenant_id IN (SELECT ur.tenant_id FROM public.user_roles ur WHERE ur.user_id = auth.uid())
);