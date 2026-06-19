
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS email text NULL;

CREATE INDEX IF NOT EXISTS professionals_email_pending_idx
  ON public.professionals(lower(email))
  WHERE user_id IS NULL AND email IS NOT NULL;

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
BEGIN
  display := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- 1) Try to claim a pending professional invitation by email
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

  -- 2) Default: create own company
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

  RETURN NEW;
END;
$function$;
