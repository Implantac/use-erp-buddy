-- Fix security linter warnings for SECURITY DEFINER functions

-- 1. Restrict execute permissions on security definer functions
-- Only authenticated users should check roles (via the app)
-- service_role always has execute permission

REVOKE ALL ON FUNCTION public.has_role(UUID, UUID, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, UUID, public.app_role) TO authenticated;

-- Only auth system/service_role should handle new user creation
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
-- (service_role keeps execute by default)

-- 2. Ensure handle_new_user has search_path set (has_role already has it)
ALTER FUNCTION public.handle_new_user() SET search_path = public;
