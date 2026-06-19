
DROP POLICY IF EXISTS company_members_insert_owner ON public.company_members;

CREATE POLICY company_members_insert_owner ON public.company_members
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = company_members.company_id
      AND c.owner_user_id = auth.uid()
  )
);

CREATE POLICY company_members_update_owner ON public.company_members
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = company_members.company_id
      AND c.owner_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = company_members.company_id
      AND c.owner_user_id = auth.uid()
  )
);
