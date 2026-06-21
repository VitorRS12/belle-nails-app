
CREATE TABLE public.professional_day_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (professional_id, blocked_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_day_blocks TO authenticated;
GRANT ALL ON public.professional_day_blocks TO service_role;

ALTER TABLE public.professional_day_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "day_blocks_select_members"
ON public.professional_day_blocks
FOR SELECT
TO authenticated
USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "day_blocks_modify_admin_or_self"
ON public.professional_day_blocks
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = professional_day_blocks.company_id
      AND c.owner_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = professional_day_blocks.professional_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = professional_day_blocks.company_id
      AND c.owner_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = professional_day_blocks.professional_id
      AND p.user_id = auth.uid()
  )
);

CREATE INDEX idx_day_blocks_pro_date
  ON public.professional_day_blocks(professional_id, blocked_date);

CREATE TRIGGER set_updated_at_day_blocks
BEFORE UPDATE ON public.professional_day_blocks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
