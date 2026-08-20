-- Only service_role should execute has_role (it's used in RLS policies)
-- The RLS engine executes as the table owner/service_role context for definer functions.
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, UUID, public.app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, UUID, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, UUID, public.app_role) FROM PUBLIC;
