ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_appointments_reminder_lookup
  ON public.appointments (date, time)
  WHERE reminder_sent_at IS NULL;