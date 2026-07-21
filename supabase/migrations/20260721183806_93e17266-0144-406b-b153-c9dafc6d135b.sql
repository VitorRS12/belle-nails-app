
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS reminder_hours_before integer[] NOT NULL DEFAULT '{24}';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS reminder_sent_hours integer[] NOT NULL DEFAULT '{}';
