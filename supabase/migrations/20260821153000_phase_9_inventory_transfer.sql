-- Add destination_unit_id to inventory_transactions
ALTER TABLE public.inventory_transactions 
ADD COLUMN destination_unit_id uuid REFERENCES public.units(id);

-- Update RLS for inventory_transactions
GRANT ALL ON public.inventory_transactions TO authenticated;
GRANT ALL ON public.inventory_transactions TO service_role;

-- Ensure RLS is updated (it should already be enabled but let's be sure)
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- If policy doesn't exist, create it. If it exists, update it.
-- Simplified policy for phase 9 expansion
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

-- Audit for transfers logic will be in the server function
