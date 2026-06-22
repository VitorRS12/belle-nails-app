
CREATE OR REPLACE FUNCTION public.get_company_plan(_company_id uuid)
 RETURNS TABLE(plan_id uuid, plan_slug text, plan_name text, status text, max_professionals integer, max_appointments_per_month integer, max_services integer, features jsonb, current_period_end timestamp with time zone, trial_ends_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  IF NOT public.is_company_member(auth.uid(), _company_id)
     AND NOT public.has_role(auth.uid(), 'super_admin') THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT
      p.id, p.slug, p.name, s.status,
      p.max_professionals, p.max_appointments_per_month, p.max_services,
      p.features, s.current_period_end, s.trial_ends_at
    FROM public.company_subscriptions s
    JOIN public.subscription_plans p ON p.id = s.plan_id
    WHERE s.company_id = _company_id
    LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  IF _user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'super_admin') THEN
    RETURN NULL;
  END IF;

  SELECT company_id INTO v_company
  FROM public.company_members
  WHERE user_id = _user_id
  ORDER BY created_at ASC
  LIMIT 1;

  RETURN v_company;
END;
$function$;
