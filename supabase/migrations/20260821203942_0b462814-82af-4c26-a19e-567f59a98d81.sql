ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand text,
ADD COLUMN IF NOT EXISTS weight numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS length numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS width numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS height numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS barcode text,
ADD COLUMN IF NOT EXISTS custom_attributes jsonb DEFAULT '{}'::jsonb;

-- Re-grant privileges to ensure consistency
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
