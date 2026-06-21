import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CompanyPlan {
  plan_id: string;
  plan_slug: string;
  plan_name: string;
  status: string;
  max_professionals: number | null;
  max_appointments_per_month: number | null;
  max_services: number | null;
  features: Record<string, unknown>;
  current_period_end: string | null;
  trial_ends_at: string | null;
}

export interface PlanUsage {
  professionals: number;
  appointmentsThisMonth: number;
  services: number;
}

export function useCompanyPlan(companyId: string | null | undefined) {
  return useQuery({
    queryKey: ["company_plan", companyId],
    enabled: !!companyId,
    staleTime: 30_000,
    queryFn: async (): Promise<{ plan: CompanyPlan | null; usage: PlanUsage }> => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [planRes, profRes, apptRes, srvRes] = await Promise.all([
        supabase.rpc("get_company_plan", { _company_id: companyId! }),
        supabase
          .from("professionals")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId!)
          .eq("active", true),
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId!)
          .gte("created_at", monthStart.toISOString()),
        supabase
          .from("services")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId!)
          .eq("active", true),
      ]);

      const plan = (planRes.data ?? [])[0] as CompanyPlan | undefined;

      return {
        plan: plan ?? null,
        usage: {
          professionals: profRes.count ?? 0,
          appointmentsThisMonth: apptRes.count ?? 0,
          services: srvRes.count ?? 0,
        },
      };
    },
  });
}
