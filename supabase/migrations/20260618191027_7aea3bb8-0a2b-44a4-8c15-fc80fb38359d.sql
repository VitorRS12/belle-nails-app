
-- =========================================================
-- FASE 1: Fundação Multi-Tenant + Papéis
-- =========================================================

-- 1. Enum de papéis globais
CREATE TYPE public.app_role AS ENUM ('super_admin', 'company_admin', 'professional', 'customer');

-- 2. Tabela companies
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  segment text,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  owner_user_id uuid NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Tabela company_members
CREATE TABLE public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'company_admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_members TO authenticated;
GRANT ALL ON public.company_members TO service_role;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_company_members_user ON public.company_members(user_id);
CREATE INDEX idx_company_members_company ON public.company_members(company_id);

-- 4. Tabela user_roles (papéis globais — pattern de segurança)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Funções SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.company_members
  WHERE user_id = _user_id
  ORDER BY created_at ASC
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_company_member(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id AND company_id = _company_id
  )
$$;

-- 6. RLS de companies / company_members / user_roles
CREATE POLICY "companies_select_member" ON public.companies
  FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), id));

CREATE POLICY "companies_insert_own" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "companies_update_owner" ON public.companies
  FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "company_members_select_own" ON public.company_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_company_member(auth.uid(), company_id));

CREATE POLICY "company_members_insert_owner" ON public.company_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_user_id = auth.uid())
  );

CREATE POLICY "company_members_delete_owner" ON public.company_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_user_id = auth.uid())
  );

CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 7. Adicionar company_id às tabelas existentes (nullable inicialmente para migração)
ALTER TABLE public.profiles ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.clients ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.appointments ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.custom_services ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- 8. Migração de dados: criar uma company para cada usuário existente em profiles
DO $$
DECLARE
  prof RECORD;
  new_company_id uuid;
  base_slug text;
  final_slug text;
  attempt int;
BEGIN
  FOR prof IN SELECT user_id, display_name FROM public.profiles LOOP
    base_slug := lower(regexp_replace(coalesce(prof.display_name, 'empresa'), '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    IF base_slug = '' THEN base_slug := 'empresa'; END IF;

    final_slug := base_slug;
    attempt := 0;
    WHILE EXISTS (SELECT 1 FROM public.companies WHERE slug = final_slug) LOOP
      attempt := attempt + 1;
      final_slug := base_slug || '-' || attempt::text;
    END LOOP;

    INSERT INTO public.companies (name, slug, owner_user_id)
    VALUES (coalesce(prof.display_name, 'Minha Empresa'), final_slug, prof.user_id)
    RETURNING id INTO new_company_id;

    INSERT INTO public.company_members (company_id, user_id, role)
    VALUES (new_company_id, prof.user_id, 'company_admin');

    INSERT INTO public.user_roles (user_id, role)
    VALUES (prof.user_id, 'company_admin')
    ON CONFLICT DO NOTHING;

    UPDATE public.profiles SET company_id = new_company_id WHERE user_id = prof.user_id;
    UPDATE public.clients SET company_id = new_company_id WHERE user_id = prof.user_id;
    UPDATE public.appointments SET company_id = new_company_id WHERE user_id = prof.user_id;
    UPDATE public.custom_services SET company_id = new_company_id WHERE user_id = prof.user_id;
  END LOOP;
END $$;

-- 9. Tornar company_id NOT NULL nas tabelas tenant-scoped
ALTER TABLE public.clients ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.appointments ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.custom_services ALTER COLUMN company_id SET NOT NULL;

-- 10. Índices de performance
CREATE INDEX idx_clients_company ON public.clients(company_id);
CREATE INDEX idx_appointments_company_date ON public.appointments(company_id, date);
CREATE INDEX idx_custom_services_company ON public.custom_services(company_id);

-- 11. Atualizar RLS para escopo por company_id (mantendo user_id como fallback de auditoria)
DROP POLICY IF EXISTS clients_select_own ON public.clients;
DROP POLICY IF EXISTS clients_insert_own ON public.clients;
DROP POLICY IF EXISTS clients_update_own ON public.clients;
DROP POLICY IF EXISTS clients_delete_own ON public.clients;

CREATE POLICY "clients_select_company" ON public.clients
  FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "clients_insert_company" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(auth.uid(), company_id) AND user_id = auth.uid());
CREATE POLICY "clients_update_company" ON public.clients
  FOR UPDATE TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "clients_delete_company" ON public.clients
  FOR DELETE TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS appts_select_own ON public.appointments;
DROP POLICY IF EXISTS appts_insert_own ON public.appointments;
DROP POLICY IF EXISTS appts_update_own ON public.appointments;
DROP POLICY IF EXISTS appts_delete_own ON public.appointments;

CREATE POLICY "appts_select_company" ON public.appointments
  FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "appts_insert_company" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(auth.uid(), company_id) AND user_id = auth.uid());
CREATE POLICY "appts_update_company" ON public.appointments
  FOR UPDATE TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "appts_delete_company" ON public.appointments
  FOR DELETE TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS custom_services_select_own ON public.custom_services;
DROP POLICY IF EXISTS custom_services_insert_own ON public.custom_services;
DROP POLICY IF EXISTS custom_services_update_own ON public.custom_services;
DROP POLICY IF EXISTS custom_services_delete_own ON public.custom_services;

CREATE POLICY "custom_services_select_company" ON public.custom_services
  FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "custom_services_insert_company" ON public.custom_services
  FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(auth.uid(), company_id) AND user_id = auth.uid());
CREATE POLICY "custom_services_update_company" ON public.custom_services
  FOR UPDATE TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "custom_services_delete_company" ON public.custom_services
  FOR DELETE TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

-- 12. Atualizar handle_new_user para criar company + membership + role automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  RETURN NEW;
END;
$$;
