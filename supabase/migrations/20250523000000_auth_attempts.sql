CREATE TABLE IF NOT EXISTS public.auth_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    type TEXT NOT NULL,
    ip_address TEXT,
    attempted_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.auth_attempts TO service_role;
GRANT SELECT, INSERT, DELETE ON public.auth_attempts TO authenticated;
-- We might need anon to insert failed attempts if not logged in
GRANT SELECT, INSERT ON public.auth_attempts TO anon;

ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access" ON public.auth_attempts
    FOR ALL TO service_role USING (true);

-- For security, we usually only want the backend to manage these, 
-- but since we're using createServerFn with supabaseAdmin it's fine.
-- If we want to allow the app to log attempts directly (which it does via server functions):
CREATE POLICY "Allow internal logging" ON public.auth_attempts
    FOR INSERT WITH CHECK (true);
