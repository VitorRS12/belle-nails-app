-- 1. Remove segment from companies
ALTER TABLE public.companies DROP COLUMN IF EXISTS segment;

-- 2. Add appointment_interval_minutes
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS appointment_interval_minutes INTEGER NOT NULL DEFAULT 30;

ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_appointment_interval_minutes_check;
ALTER TABLE public.companies
  ADD CONSTRAINT companies_appointment_interval_minutes_check
  CHECK (appointment_interval_minutes BETWEEN 5 AND 240);

-- 3. profiles.areas (text[]) -> profiles.area (text single)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS area TEXT;

UPDATE public.profiles
SET area = COALESCE(
  (
    SELECT v
    FROM unnest(COALESCE(areas, ARRAY[]::text[])) AS v
    WHERE v IN ('manicure','cilios','sobrancelhas')
    LIMIT 1
  ),
  'manicure'
)
WHERE area IS NULL;

ALTER TABLE public.profiles ALTER COLUMN area SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN area SET DEFAULT 'manicure';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_area_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_area_check
  CHECK (area IN ('manicure','cilios','sobrancelhas'));

ALTER TABLE public.profiles DROP COLUMN IF EXISTS areas;