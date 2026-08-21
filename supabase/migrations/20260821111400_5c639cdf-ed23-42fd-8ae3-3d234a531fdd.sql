-- Create inventory_transactions table
CREATE TABLE public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'transfer')),
    quantity NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add missing RLS and Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_transactions TO authenticated;
GRANT ALL ON public.inventory_transactions TO service_role;

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage inventory transactions for their tenant"
ON public.inventory_transactions
FOR ALL
TO authenticated
USING (tenant_id = (SELECT (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid))
WITH CHECK (tenant_id = (SELECT (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

-- Update products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS min_stock NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(20) DEFAULT 'un';

-- Function for low stock count
CREATE OR REPLACE FUNCTION public.get_low_stock_count(_tenant_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT count(*)
  FROM public.products
  WHERE tenant_id = _tenant_id
    AND stock_quantity < min_stock
    AND active = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_low_stock_count(uuid) TO authenticated;
