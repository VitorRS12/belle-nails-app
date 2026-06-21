
-- ============= SUBSCRIPTION PLANS =============
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  interval TEXT NOT NULL DEFAULT 'month' CHECK (interval IN ('month','year')),
  max_professionals INTEGER,
  max_appointments_per_month INTEGER,
  max_services INTEGER,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.subscription_plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_plans TO authenticated;
GRANT ALL ON public.subscription_plans TO service_role;

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_public_select_active"
ON public.subscription_plans FOR SELECT
USING (active = true OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "plans_admin_modify"
ON public.subscription_plans FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER set_updated_at_plans
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============= COMPANY SUBSCRIPTIONS =============
CREATE TABLE public.company_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('trialing','active','past_due','canceled','incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_subscriptions TO authenticated;
GRANT ALL ON public.company_subscriptions TO service_role;

ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub_select_self_or_admin"
ON public.company_subscriptions FOR SELECT
TO authenticated
USING (
  public.is_company_member(auth.uid(), company_id)
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "sub_admin_modify"
ON public.company_subscriptions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER set_updated_at_subs
BEFORE UPDATE ON public.company_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_subs_company ON public.company_subscriptions(company_id);
CREATE INDEX idx_subs_status ON public.company_subscriptions(status);

-- ============= SEED PLANS =============
INSERT INTO public.subscription_plans
  (slug, name, description, price_cents, currency, interval, max_professionals, max_appointments_per_month, max_services, features, sort_order)
VALUES
  ('free',     'Free',     'Para começar, sem custo.',                0,    'BRL', 'month',  1,    30,   5,    '{"public_booking":true,"email_notifications":true,"reports":false,"branding_removal":false}'::jsonb, 1),
  ('pro',      'Pro',      'Para salões em crescimento.',             4900, 'BRL', 'month',  5,    NULL, NULL, '{"public_booking":true,"email_notifications":true,"reports":true,"branding_removal":false}'::jsonb,  2),
  ('business', 'Business', 'Equipes grandes com necessidades plenas.', 9900, 'BRL', 'month',  NULL, NULL, NULL, '{"public_booking":true,"email_notifications":true,"reports":true,"branding_removal":true}'::jsonb,   3);

-- ============= HELPER FUNCTIONS =============
CREATE OR REPLACE FUNCTION public.get_company_plan(_company_id UUID)
RETURNS TABLE (
  plan_id UUID,
  plan_slug TEXT,
  plan_name TEXT,
  status TEXT,
  max_professionals INTEGER,
  max_appointments_per_month INTEGER,
  max_services INTEGER,
  features JSONB,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.slug, p.name, s.status,
    p.max_professionals, p.max_appointments_per_month, p.max_services,
    p.features, s.current_period_end, s.trial_ends_at
  FROM public.company_subscriptions s
  JOIN public.subscription_plans p ON p.id = s.plan_id
  WHERE s.company_id = _company_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.can_create_appointment(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max INTEGER;
  v_count INTEGER;
BEGIN
  SELECT p.max_appointments_per_month
    INTO v_max
  FROM public.company_subscriptions s
  JOIN public.subscription_plans p ON p.id = s.plan_id
  WHERE s.company_id = _company_id
  LIMIT 1;

  IF v_max IS NULL THEN RETURN TRUE; END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.appointments
  WHERE company_id = _company_id
    AND created_at >= date_trunc('month', now());

  RETURN v_count < v_max;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_company_plan(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_create_appointment(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_company_plan(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_create_appointment(UUID) TO service_role;

-- ============= BACKFILL: every existing company gets Free plan =============
INSERT INTO public.company_subscriptions (company_id, plan_id, status)
SELECT c.id, (SELECT id FROM public.subscription_plans WHERE slug = 'free'), 'active'
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.company_subscriptions s WHERE s.company_id = c.id
);

-- ============= EXTEND handle_new_user TO ASSIGN FREE PLAN =============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  display text;
  base_slug text;
  final_slug text;
  attempt int := 0;
  new_company_id uuid;
  pending_prof_id uuid;
  pending_company_id uuid;
  free_plan_id uuid;
BEGIN
  display := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  SELECT id, company_id INTO pending_prof_id, pending_company_id
  FROM public.professionals
  WHERE user_id IS NULL
    AND email IS NOT NULL
    AND lower(email) = lower(NEW.email)
  ORDER BY created_at ASC
  LIMIT 1;

  IF pending_prof_id IS NOT NULL THEN
    UPDATE public.professionals
       SET user_id = NEW.id, email = NULL
     WHERE id = pending_prof_id;

    INSERT INTO public.company_members (company_id, user_id, role)
    VALUES (pending_company_id, NEW.id, 'professional')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'professional')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.profiles (user_id, display_name, company_id)
    VALUES (NEW.id, display, pending_company_id)
    ON CONFLICT (user_id) DO UPDATE SET company_id = EXCLUDED.company_id;

    RETURN NEW;
  END IF;

  base_slug := lower(regexp_replace(coalesce(display, 'empresa'), '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  IF base_slug = '' THEN base_slug := 'empresa'; END IF;

  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.companies WHERE slug = final_slug) LOOP
    attempt := attempt + 1;
    final_slug := base_slug || '-' || attempt::text;
  END LOOP;

  INSERT INTO public.companies (name, slug, owner_user_id)
  VALUES (display, final_slug, NEW.id)
  RETURNING id INTO new_company_id;

  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (new_company_id, NEW.id, 'company_admin');

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'company_admin')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.profiles (user_id, display_name, company_id)
  VALUES (NEW.id, display, new_company_id)
  ON CONFLICT (user_id) DO UPDATE SET company_id = EXCLUDED.company_id;

  INSERT INTO public.professionals (company_id, user_id, name, active)
  VALUES (new_company_id, NEW.id, display, true);

  SELECT id INTO free_plan_id FROM public.subscription_plans WHERE slug = 'free' LIMIT 1;
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.company_subscriptions (company_id, plan_id, status)
    VALUES (new_company_id, free_plan_id, 'active')
    ON CONFLICT (company_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;
