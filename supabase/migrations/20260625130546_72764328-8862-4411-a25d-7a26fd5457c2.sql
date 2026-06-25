
-- Restrict company_subscriptions SELECT to company owner or super_admin
DROP POLICY IF EXISTS sub_select_self_or_admin ON public.company_subscriptions;

CREATE POLICY sub_select_owner_or_admin
ON public.company_subscriptions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = company_subscriptions.company_id
      AND c.owner_user_id = auth.uid()
  )
);

-- Harden customer_profiles: enforce user_id NOT NULL so no orphan rows can exist
ALTER TABLE public.customer_profiles
  ALTER COLUMN user_id SET NOT NULL;
