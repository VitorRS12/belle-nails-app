
-- Drop empty professional_services (will recreate pointing to services)
DROP TABLE IF EXISTS public.professional_services;

-- 1) services
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NULL,
  category text NULL,
  duration_minutes int NOT NULL DEFAULT 60 CHECK (duration_minutes > 0 AND duration_minutes <= 600),
  price numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  color text NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX services_company_idx ON public.services(company_id);
CREATE INDEX services_company_active_idx ON public.services(company_id) WHERE active = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY services_select_members ON public.services FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY services_modify_admin ON public.services FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_user_id = auth.uid()));

CREATE TRIGGER services_set_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Backfill from custom_services, preserving IDs
INSERT INTO public.services (id, company_id, name, price, duration_minutes, active)
SELECT id, company_id, name, price, 60, true FROM public.custom_services
ON CONFLICT (id) DO NOTHING;

-- 2) professional_services -> FK to services
CREATE TABLE public.professional_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
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

CREATE POLICY prof_serv_select_members ON public.professional_services FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY prof_serv_modify_admin_or_self ON public.professional_services FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
  );

-- 3) customer_profiles
CREATE TABLE public.customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL UNIQUE,
  full_name text NOT NULL,
  email text NULL,
  phone text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_profiles_email_idx ON public.customer_profiles(lower(email)) WHERE email IS NOT NULL;
CREATE INDEX customer_profiles_phone_idx ON public.customer_profiles(phone) WHERE phone IS NOT NULL;

GRANT SELECT, INSERT, UPDATE ON public.customer_profiles TO authenticated;
GRANT ALL ON public.customer_profiles TO service_role;

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY cust_profile_select_own ON public.customer_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY cust_profile_update_own ON public.customer_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER customer_profiles_set_updated_at BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) Link appointments.service_id -> services (optional reference)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS service_id uuid NULL REFERENCES public.services(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS appointments_service_idx ON public.appointments(service_id) WHERE service_id IS NOT NULL;
