
CREATE TABLE public.checkout_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz
);

GRANT SELECT ON public.checkout_sessions TO authenticated;
GRANT ALL ON public.checkout_sessions TO service_role;

ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Only the owner of the session can read it; writes only via service role (edge functions)
CREATE POLICY "Users view their own checkout sessions"
  ON public.checkout_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_checkout_sessions_company ON public.checkout_sessions(company_id);
