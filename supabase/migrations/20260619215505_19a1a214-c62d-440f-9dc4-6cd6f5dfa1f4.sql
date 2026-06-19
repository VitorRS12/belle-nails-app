GRANT EXECUTE ON FUNCTION public.is_company_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_company_id(uuid) TO authenticated, service_role;