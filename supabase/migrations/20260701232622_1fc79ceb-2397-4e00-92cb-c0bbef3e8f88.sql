
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS cancellation_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS appointments_cancellation_token_idx
  ON public.appointments(cancellation_token);

-- Enable realtime for appointments so the panel updates instantly on new bookings
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'appointments'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments';
  END IF;
END $$;
