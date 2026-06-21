import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionPlan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  interval: string;
  max_professionals: number | null;
  max_appointments_per_month: number | null;
  max_services: number | null;
  features: Record<string, unknown>;
  active: boolean;
  sort_order: number;
  stripe_price_id: string | null;
}

export function usePlans(opts?: { onlyActive?: boolean }) {
  return useQuery({
    queryKey: ["subscription_plans", opts?.onlyActive ?? false],
    staleTime: 60_000,
    queryFn: async (): Promise<SubscriptionPlan[]> => {
      let q = supabase.from("subscription_plans").select("*").order("sort_order");
      if (opts?.onlyActive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as SubscriptionPlan[];
    },
  });
}

export type PlanInput = Partial<Omit<SubscriptionPlan, "id">> & { id?: string };

export function useUpsertPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PlanInput) => {
      const { error } = await supabase
        .from("subscription_plans")
        .upsert(input as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscription_plans"] }),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("subscription_plans")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscription_plans"] }),
  });
}
