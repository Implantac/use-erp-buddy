CREATE TABLE IF NOT EXISTS public.auth_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    type TEXT NOT NULL,
    ip_address TEXT,
    attempted_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.auth_attempts TO service_role;
GRANT SELECT, INSERT, DELETE ON public.auth_attempts TO authenticated;
GRANT SELECT, INSERT ON public.auth_attempts TO anon;

ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access" ON public.auth_attempts
    FOR ALL TO service_role USING (true);

CREATE POLICY "Allow internal logging" ON public.auth_attempts
    FOR INSERT WITH CHECK (true);
