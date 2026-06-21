ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS trial_days INTEGER NOT NULL DEFAULT 0;
UPDATE public.subscription_plans SET trial_days = 30 WHERE slug IN ('pro','business');