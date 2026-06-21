ALTER TABLE public.company_subscriptions
  ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS environment TEXT NOT NULL DEFAULT 'sandbox',
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_company_subscriptions_paddle_sub
  ON public.company_subscriptions(paddle_subscription_id)
  WHERE paddle_subscription_id IS NOT NULL;

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS paddle_price_id TEXT;

UPDATE public.subscription_plans SET paddle_price_id = 'plan_pro_monthly' WHERE slug = 'pro';
UPDATE public.subscription_plans SET paddle_price_id = 'plan_business_monthly' WHERE slug = 'business';