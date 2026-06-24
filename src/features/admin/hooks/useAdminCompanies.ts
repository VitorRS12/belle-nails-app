import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminCompany {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  plan_name: string | null;
  plan_id: string | null;
  status: string | null;
  professional_count: number;
  appointments_this_month: number;
}

export function useAdminCompanies() {
  return useQuery({
    queryKey: ["admin", "companies"],
    staleTime: 30_000,
    queryFn: async (): Promise<AdminCompany[]> => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [companies, subs, plans, professionals, appts] = await Promise.all([
        supabase
          .from("companies")
          .select("id, name, slug, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("company_subscriptions")
          .select("company_id, plan_id, status"),
        supabase.from("subscription_plans").select("id, name"),
        supabase.from("professionals").select("company_id, active"),
        supabase
          .from("appointments")
          .select("company_id, created_at")
          .gte("created_at", monthStart.toISOString()),
      ]);

      const planMap = new Map((plans.data ?? []).map((p) => [p.id, p.name]));
      const subMap = new Map(
        (subs.data ?? []).map((s) => [
          s.company_id,
          { plan_id: s.plan_id, plan_name: planMap.get(s.plan_id) ?? null, status: s.status },
        ])
      );
      const profCount = new Map<string, number>();
      (professionals.data ?? []).forEach((p) => {
        if (!p.active) return;
        profCount.set(p.company_id, (profCount.get(p.company_id) ?? 0) + 1);
      });
      const apptCount = new Map<string, number>();
      (appts.data ?? []).forEach((a) => {
        apptCount.set(a.company_id, (apptCount.get(a.company_id) ?? 0) + 1);
      });

      return (companies.data ?? []).map((c) => {
        const sub = subMap.get(c.id);
        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          created_at: c.created_at,
          plan_id: sub?.plan_id ?? null,
          plan_name: sub?.plan_name ?? null,
          status: sub?.status ?? null,
          professional_count: profCount.get(c.id) ?? 0,
          appointments_this_month: apptCount.get(c.id) ?? 0,
        };
      });
    },
  });
}

export function useChangeCompanyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { companyId: string; planId: string }) => {
      const { error } = await supabase
        .from("company_subscriptions")
        .update({ plan_id: params.planId, status: "active" })
        .eq("company_id", params.companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "companies"] });
      qc.invalidateQueries({ queryKey: ["admin", "metrics"] });
    },
  });
}
