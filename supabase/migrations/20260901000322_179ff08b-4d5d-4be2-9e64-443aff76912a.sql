ALTER TABLE public.company_subscriptions
  ADD COLUMN IF NOT EXISTS trial_notice_7d_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_notice_1d_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS renewal_notice_for_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS payment_failed_notice_sent_at timestamptz;