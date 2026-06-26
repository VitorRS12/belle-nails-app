
-- 1) Renomear plano Free para Starter R$30
UPDATE public.subscription_plans
SET slug = 'starter',
    name = 'Starter',
    description = 'Para profissionais autônomos. Inclui 30 dias de teste grátis.',
    price_cents = 3000,
    max_appointments_per_month = NULL,
    max_services = NULL,
    max_professionals = 1,
    sort_order = 1
WHERE slug = 'free';

-- 2) Migrar assinaturas existentes que apontavam para o antigo Free
-- (mantêm o mesmo plan_id, já renomeado). Coloca em trialing por 30 dias
-- a partir de agora para quem ainda não pagou.
UPDATE public.company_subscriptions s
SET status = 'trialing',
    trial_ends_at = COALESCE(s.trial_ends_at, now() + interval '30 days')
WHERE s.plan_id = (SELECT id FROM public.subscription_plans WHERE slug = 'starter')
  AND s.paddle_subscription_id IS NULL;

-- 3) Atualiza handle_new_user: novo cadastro entra no Starter em modo trial 30d
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
  starter_plan_id uuid;
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

  SELECT id INTO starter_plan_id FROM public.subscription_plans WHERE slug = 'starter' LIMIT 1;
  IF starter_plan_id IS NOT NULL THEN
    INSERT INTO public.company_subscriptions (company_id, plan_id, status, trial_ends_at)
    VALUES (new_company_id, starter_plan_id, 'trialing', now() + interval '30 days')
    ON CONFLICT (company_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- 4) can_create_appointment respeita fim do trial
CREATE OR REPLACE FUNCTION public.can_create_appointment(_company_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_status text;
  v_trial_ends timestamptz;
  v_period_end timestamptz;
  v_max INTEGER;
  v_count INTEGER;
BEGIN
  SELECT s.status, s.trial_ends_at, s.current_period_end, p.max_appointments_per_month
    INTO v_status, v_trial_ends, v_period_end, v_max
  FROM public.company_subscriptions s
  JOIN public.subscription_plans p ON p.id = s.plan_id
  WHERE s.company_id = _company_id
  LIMIT 1;

  -- Sem assinatura -> bloqueia
  IF v_status IS NULL THEN RETURN FALSE; END IF;

  -- Trial expirado e sem período pago ativo -> somente leitura
  IF v_status = 'trialing' AND v_trial_ends IS NOT NULL AND v_trial_ends < now() THEN
    RETURN FALSE;
  END IF;

  -- Cancelada/past_due fora do período pago -> bloqueia
  IF v_status IN ('canceled', 'past_due', 'paused')
     AND (v_period_end IS NULL OR v_period_end < now()) THEN
    RETURN FALSE;
  END IF;

  -- Limite mensal (se houver)
  IF v_max IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM public.appointments
    WHERE company_id = _company_id
      AND created_at >= date_trunc('month', now());
    IF v_count >= v_max THEN RETURN FALSE; END IF;
  END IF;

  RETURN TRUE;
END;
$function$;
