import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminMetrics {
  totalCompanies: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  appointmentsThisMonth: number;
  mrrCents: number;
  newCompanies30d: number;
}

export function useAdminMetrics() {
  return useQuery({
    queryKey: ["admin", "metrics"],
    staleTime: 30_000,
    queryFn: async (): Promise<AdminMetrics> => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [companies, subs, monthAppts, recentCompanies, plans] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase
          .from("company_subscriptions")
          .select("id, status, plan_id", { count: "exact" }),
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .gte("created_at", monthStart.toISOString()),
        supabase
          .from("companies")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since30.toISOString()),
        supabase.from("subscription_plans").select("id, price_cents"),
      ]);

      const planPriceMap = new Map(
        (plans.data ?? []).map((p) => [p.id, p.price_cents ?? 0])
      );
      const subRows = subs.data ?? [];
      const activeSubs = subRows.filter((s) => s.status === "active");
      const trialingSubs = subRows.filter((s) => s.status === "trialing");
      const mrrCents = activeSubs.reduce(
        (sum, s) => sum + (planPriceMap.get(s.plan_id) ?? 0),
        0
      );

      return {
        totalCompanies: companies.count ?? 0,
        activeSubscriptions: activeSubs.length,
        trialingSubscriptions: trialingSubs.length,
        appointmentsThisMonth: monthAppts.count ?? 0,
        mrrCents,
        newCompanies30d: recentCompanies.count ?? 0,
      };
    },
  });
}
