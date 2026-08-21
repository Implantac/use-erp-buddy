-- Add 'waiting_approval' and 'approved' to status if not already handled by logic
-- Update purchase_orders table to support the new status flow

-- Grant update permissions for status changes
GRANT UPDATE(status) ON public.purchase_orders TO authenticated;

-- Ensure RLS allows the update
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

-- Audit log will be handled by the server function
