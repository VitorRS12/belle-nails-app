REVOKE EXECUTE ON FUNCTION public.is_company_admin(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.owns_professional(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_company_admin(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.owns_professional(uuid, uuid) TO authenticated, service_role;