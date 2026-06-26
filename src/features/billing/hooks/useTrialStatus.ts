import { useCompany } from "@/hooks/useCompany";
import { useCompanyPlan } from "./useCompanyPlan";

export interface TrialStatus {
  isTrialing: boolean;
  isTrialExpired: boolean;
  daysLeft: number | null;
  isReadOnly: boolean;
  hasActivePaid: boolean;
}

export function useTrialStatus(): TrialStatus {
  const { company } = useCompany();
  const { data } = useCompanyPlan(company?.id);
  const plan = data?.plan;

  if (!plan) {
    return {
      isTrialing: false,
      isTrialExpired: false,
      daysLeft: null,
      isReadOnly: false,
      hasActivePaid: false,
    };
  }

  const now = Date.now();
  const trialEnd = plan.trial_ends_at ? new Date(plan.trial_ends_at).getTime() : null;
  const periodEnd = plan.current_period_end ? new Date(plan.current_period_end).getTime() : null;

  const isTrialing = plan.status === "trialing";
  const isTrialExpired = isTrialing && trialEnd !== null && trialEnd < now;
  const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd - now) / 86_400_000)) : null;

  const hasActivePaid =
    plan.status === "active" && (periodEnd === null || periodEnd > now);

  const blockedStatus =
    ["canceled", "past_due", "paused"].includes(plan.status) &&
    (periodEnd === null || periodEnd < now);

  const isReadOnly = isTrialExpired || blockedStatus;

  return { isTrialing, isTrialExpired, daysLeft, isReadOnly, hasActivePaid };
}
