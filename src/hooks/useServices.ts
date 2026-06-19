import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";
import { toast } from "sonner";

export interface Service {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  category: string | null;
  duration_minutes: number;
  price: number;
  color: string | null;
  active: boolean;
}

export type ServiceInput = {
  name: string;
  description?: string | null;
  category?: string | null;
  duration_minutes: number;
  price: number;
  color?: string | null;
  active?: boolean;
};

export function useServices() {
  const { company } = useCompany();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!company) {
      setServices([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("id, company_id, name, description, category, duration_minutes, price, color, active")
      .eq("company_id", company.id)
      .order("name");
    if (error) toast.error("Não foi possível carregar os serviços");
    else
      setServices(
        (data ?? []).map((d) => ({
          ...d,
          price: Number(d.price) || 0,
        })) as Service[]
      );
    setLoading(false);
  }, [company]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: ServiceInput) => {
      if (!company) return false;
      const { error } = await supabase.from("services").insert({
        company_id: company.id,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        category: input.category?.trim() || null,
        duration_minutes: input.duration_minutes,
        price: input.price,
        color: input.color ?? null,
        active: input.active ?? true,
      });
      if (error) {
        toast.error("Não foi possível salvar");
        return false;
      }
      toast.success("Serviço criado");
      await refresh();
      return true;
    },
    [company, refresh]
  );

  const update = useCallback(
    async (id: string, patch: Partial<ServiceInput>) => {
      const clean: Record<string, unknown> = { ...patch };
      if (typeof clean.name === "string") clean.name = (clean.name as string).trim();
      const { error } = await supabase.from("services").update(clean).eq("id", id);
      if (error) {
        toast.error("Não foi possível salvar");
        return false;
      }
      toast.success("Alterações salvas");
      await refresh();
      return true;
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) {
        toast.error("Não foi possível remover");
        return false;
      }
      toast.success("Serviço removido");
      await refresh();
      return true;
    },
    [refresh]
  );

  return { services, loading, refresh, create, update, remove };
}
