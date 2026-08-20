
-- Table to track authentication attempts
CREATE TABLE IF NOT EXISTS public.auth_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- email or IP
    type TEXT NOT NULL, -- 'login', 'reset_password'
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address TEXT
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_auth_attempts_identifier ON public.auth_attempts(identifier);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_attempted_at ON public.auth_attempts(attempted_at);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.auth_attempts TO authenticated;
GRANT ALL ON public.auth_attempts TO service_role;
GRANT INSERT ON public.auth_attempts TO anon; -- Allow recording attempts from login page (anon)

-- Enable RLS
ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Service role full access" ON public.auth_attempts FOR ALL TO service_role USING (true);
CREATE POLICY "Anon can insert" ON public.auth_attempts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated users can see their own attempts by identifier" ON public.auth_attempts FOR SELECT TO authenticated USING (identifier = auth.jwt()->>'email');
