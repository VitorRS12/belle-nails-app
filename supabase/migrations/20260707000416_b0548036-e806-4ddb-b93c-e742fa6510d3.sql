
-- 1) checkout_sessions: add explicit deny policies for write operations by authenticated users
DROP POLICY IF EXISTS "Deny client inserts on checkout_sessions" ON public.checkout_sessions;
CREATE POLICY "Deny client inserts on checkout_sessions"
  ON public.checkout_sessions FOR INSERT TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "Deny client updates on checkout_sessions" ON public.checkout_sessions;
CREATE POLICY "Deny client updates on checkout_sessions"
  ON public.checkout_sessions FOR UPDATE TO authenticated
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Deny client deletes on checkout_sessions" ON public.checkout_sessions;
CREATE POLICY "Deny client deletes on checkout_sessions"
  ON public.checkout_sessions FOR DELETE TO authenticated
  USING (false);

-- 2) professional_day_blocks: split ALL policy; enforce company_id consistency
DROP POLICY IF EXISTS "day_blocks_modify_admin_or_self" ON public.professional_day_blocks;

CREATE POLICY "day_blocks_admin_all"
  ON public.professional_day_blocks FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.companies c
      WHERE c.id = professional_day_blocks.company_id AND c.owner_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'company_admin')
       AND public.is_company_member(auth.uid(), professional_day_blocks.company_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.companies c
      WHERE c.id = professional_day_blocks.company_id AND c.owner_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'company_admin')
       AND public.is_company_member(auth.uid(), professional_day_blocks.company_id)
  );

CREATE POLICY "day_blocks_self_modify"
  ON public.professional_day_blocks FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = professional_day_blocks.professional_id
        AND p.user_id = auth.uid()
        AND p.company_id = professional_day_blocks.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = professional_day_blocks.professional_id
        AND p.user_id = auth.uid()
        AND p.company_id = professional_day_blocks.company_id
    )
  );

-- 3) professional_services: professionals get SELECT + INSERT only; admins/owners get UPDATE/DELETE
DROP POLICY IF EXISTS "prof_serv_modify_admin_or_self" ON public.professional_services;

CREATE POLICY "prof_serv_admin_all"
  ON public.professional_services FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.companies c
      WHERE c.id = professional_services.company_id AND c.owner_user_id = auth.uid())
    OR (public.has_role(auth.uid(), 'company_admin')
        AND public.is_company_member(auth.uid(), professional_services.company_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.companies c
      WHERE c.id = professional_services.company_id AND c.owner_user_id = auth.uid())
    OR (public.has_role(auth.uid(), 'company_admin')
        AND public.is_company_member(auth.uid(), professional_services.company_id))
  );

CREATE POLICY "prof_serv_self_insert"
  ON public.professional_services FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = professional_services.professional_id
        AND p.user_id = auth.uid()
        AND p.company_id = professional_services.company_id
    )
    AND EXISTS (
      SELECT 1 FROM public.services s
      WHERE s.id = professional_services.service_id
        AND s.company_id = professional_services.company_id
    )
  );
