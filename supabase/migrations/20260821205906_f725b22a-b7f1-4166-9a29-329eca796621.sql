-- Fix search_path for all SECURITY DEFINER functions in public schema
ALTER FUNCTION public.has_role(_user_id uuid, _tenant_id uuid, _role app_role) SET search_path = public;
ALTER FUNCTION public.check_access(_user_id uuid, _company_id uuid, _unit_id uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.get_low_stock_count(_tenant_id uuid) SET search_path = public;

-- Revoke execute from public for all except handle_new_user (which might be used by auth trigger)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_access(uuid, uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_low_stock_count(uuid) FROM PUBLIC;

-- Grant to appropriate roles
GRANT EXECUTE ON FUNCTION public.has_role(uuid, uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_access(uuid, uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_low_stock_count(uuid) TO authenticated, service_role;
