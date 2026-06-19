
-- Phase 2: Professionals within a company

-- 1) professionals
CREATE TABLE public.professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NULL,
  name text NOT NULL,
  photo_url text NULL,
  bio text NULL,
  specialties text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX professionals_company_idx ON public.professionals(company_id);
CREATE INDEX professionals_user_idx ON public.professionals(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX professionals_company_user_uq ON public.professionals(company_id, user_id) WHERE user_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.professionals TO authenticated;
GRANT ALL ON public.professionals TO service_role;

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "professionals_select_company_members"
  ON public.professionals FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "professionals_insert_company_admin"
  ON public.professionals FOR INSERT TO authenticated
  WITH CHECK (
    public.is_company_member(auth.uid(), company_id)
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "professionals_update_company_admin"
  ON public.professionals FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_user_id = auth.uid()
    )
    OR user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "professionals_delete_company_admin"
  ON public.professionals FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_user_id = auth.uid()
    )
  );

CREATE TRIGGER professionals_set_updated_at
  BEFORE UPDATE ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) professional_schedules
CREATE TABLE public.professional_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE INDEX professional_schedules_professional_idx ON public.professional_schedules(professional_id);
CREATE INDEX professional_schedules_company_idx ON public.professional_schedules(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_schedules TO authenticated;
GRANT ALL ON public.professional_schedules TO service_role;

ALTER TABLE public.professional_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prof_sched_select_members"
  ON public.professional_schedules FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "prof_sched_modify_admin_or_self"
  ON public.professional_schedules FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );

CREATE TRIGGER prof_sched_set_updated_at
  BEFORE UPDATE ON public.professional_schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) professional_services (N:N with custom_services)
CREATE TABLE public.professional_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.custom_services(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professional_id, service_id)
);

CREATE INDEX professional_services_professional_idx ON public.professional_services(professional_id);
CREATE INDEX professional_services_service_idx ON public.professional_services(service_id);
CREATE INDEX professional_services_company_idx ON public.professional_services(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_services TO authenticated;
GRANT ALL ON public.professional_services TO service_role;

ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prof_serv_select_members"
  ON public.professional_services FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "prof_serv_modify_admin_or_self"
  ON public.professional_services FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );

-- 4) Add professional_id to appointments (nullable for backward compat)
ALTER TABLE public.appointments
  ADD COLUMN professional_id uuid NULL REFERENCES public.professionals(id) ON DELETE SET NULL;

CREATE INDEX appointments_professional_idx ON public.appointments(professional_id) WHERE professional_id IS NOT NULL;
CREATE INDEX appointments_company_date_idx ON public.appointments(company_id, date);

-- 5) Backfill: create default professional for each company owner; link existing appointments
DO $$
DECLARE
  rec RECORD;
  new_prof_id uuid;
BEGIN
  FOR rec IN
    SELECT c.id AS company_id, c.owner_user_id, c.name,
           COALESCE(p.display_name, c.name) AS display_name
    FROM public.companies c
    LEFT JOIN public.profiles p ON p.user_id = c.owner_user_id
  LOOP
    INSERT INTO public.professionals (company_id, user_id, name, active)
    VALUES (rec.company_id, rec.owner_user_id, rec.display_name, true)
    ON CONFLICT (company_id, user_id) WHERE user_id IS NOT NULL DO NOTHING
    RETURNING id INTO new_prof_id;

    IF new_prof_id IS NULL THEN
      SELECT id INTO new_prof_id FROM public.professionals
      WHERE company_id = rec.company_id AND user_id = rec.owner_user_id LIMIT 1;
    END IF;

    UPDATE public.appointments
    SET professional_id = new_prof_id
    WHERE company_id = rec.company_id
      AND professional_id IS NULL
      AND user_id = rec.owner_user_id;
  END LOOP;
END $$;

-- 6) Update handle_new_user to also create a default professional record
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
BEGIN
  display := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

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
