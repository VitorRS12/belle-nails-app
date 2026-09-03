CREATE OR REPLACE FUNCTION public.prevent_professional_company_reassignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    IF auth.uid() IS NULL THEN
      RETURN NEW; -- service_role / server-side jobs
    END IF;
    IF NOT (
      public.is_company_admin(auth.uid(), OLD.company_id)
      AND public.is_company_admin(auth.uid(), NEW.company_id)
    ) THEN
      RAISE EXCEPTION 'Not allowed to change company_id of a professional';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_professionals_prevent_company_reassignment ON public.professionals;
CREATE TRIGGER trg_professionals_prevent_company_reassignment
BEFORE UPDATE ON public.professionals
FOR EACH ROW EXECUTE FUNCTION public.prevent_professional_company_reassignment();