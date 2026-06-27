
WITH business_plan AS (SELECT id FROM public.subscription_plans WHERE slug = 'business' LIMIT 1),
target_companies AS (
  SELECT c.id AS company_id
  FROM public.companies c
  JOIN auth.users u ON u.id = c.owner_user_id
  WHERE u.email IN ('vitoredelson345@gmail.com','evelynlealleao.pedro@gmail.com','cillamedeiros279@gmail.com')
)
UPDATE public.company_subscriptions cs
   SET plan_id = (SELECT id FROM business_plan),
       status = 'active',
       trial_ends_at = NULL,
       current_period_end = now() + interval '100 years'
 WHERE cs.company_id IN (SELECT company_id FROM target_companies);
