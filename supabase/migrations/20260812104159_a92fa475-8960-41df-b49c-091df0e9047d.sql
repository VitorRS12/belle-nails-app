-- 1) Areas de atuação da profissional
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS areas text[] NOT NULL DEFAULT '{}'::text[];

-- 2) Helper: é admin/dona da empresa?
CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = _company_id AND c.owner_user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.company_members m
    WHERE m.company_id = _company_id
      AND m.user_id = _user_id
      AND m.role = 'company_admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_company_admin(uuid, uuid) TO authenticated;

-- 3) Helper: ids das fichas de profissional do usuário
CREATE OR REPLACE FUNCTION public.owns_professional(_user_id uuid, _professional_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = _professional_id AND p.user_id = _user_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.owns_professional(uuid, uuid) TO authenticated;

-- 4) Appointments: admin vê tudo; profissional vê o que é dela
DROP POLICY IF EXISTS appts_select_company ON public.appointments;
CREATE POLICY appts_select_company ON public.appointments
FOR SELECT TO authenticated
USING (
  public.is_company_member(auth.uid(), company_id)
  AND (
    public.is_company_admin(auth.uid(), company_id)
    OR user_id = auth.uid()
    OR public.owns_professional(auth.uid(), professional_id)
  )
);

DROP POLICY IF EXISTS appts_update_company ON public.appointments;
CREATE POLICY appts_update_company ON public.appointments
FOR UPDATE TO authenticated
USING (
  public.is_company_member(auth.uid(), company_id)
  AND (
    public.is_company_admin(auth.uid(), company_id)
    OR user_id = auth.uid()
    OR public.owns_professional(auth.uid(), professional_id)
  )
)
WITH CHECK (public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS appts_delete_company ON public.appointments;
CREATE POLICY appts_delete_company ON public.appointments
FOR DELETE TO authenticated
USING (
  public.is_company_member(auth.uid(), company_id)
  AND (
    public.is_company_admin(auth.uid(), company_id)
    OR user_id = auth.uid()
    OR public.owns_professional(auth.uid(), professional_id)
  )
);

-- 5) Clients: admin vê tudo; profissional vê os dela
DROP POLICY IF EXISTS clients_select_company ON public.clients;
CREATE POLICY clients_select_company ON public.clients
FOR SELECT TO authenticated
USING (
  public.is_company_member(auth.uid(), company_id)
  AND (
    public.is_company_admin(auth.uid(), company_id)
    OR user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS clients_update_company ON public.clients;
CREATE POLICY clients_update_company ON public.clients
FOR UPDATE TO authenticated
USING (
  public.is_company_member(auth.uid(), company_id)
  AND (public.is_company_admin(auth.uid(), company_id) OR user_id = auth.uid())
)
WITH CHECK (public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS clients_delete_company ON public.clients;
CREATE POLICY clients_delete_company ON public.clients
FOR DELETE TO authenticated
USING (
  public.is_company_member(auth.uid(), company_id)
  AND (public.is_company_admin(auth.uid(), company_id) OR user_id = auth.uid())
);
