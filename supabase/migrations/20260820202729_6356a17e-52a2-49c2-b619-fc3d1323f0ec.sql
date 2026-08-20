-- Add active column to categories table if it doesn't exist
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Update RLS or add missing grants if necessary
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
