
CREATE TABLE public.custom_services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  area text NOT NULL DEFAULT 'manicure',
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, area, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_services TO authenticated;
GRANT ALL ON public.custom_services TO service_role;

ALTER TABLE public.custom_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY custom_services_select_own ON public.custom_services
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY custom_services_insert_own ON public.custom_services
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY custom_services_update_own ON public.custom_services
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY custom_services_delete_own ON public.custom_services
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER custom_services_set_updated_at
  BEFORE UPDATE ON public.custom_services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
