import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProfessionalServiceLink {
  id: string;
  professional_id: string;
  service_id: string;
  company_id: string;
}

export function useProfessionalServices(professionalId: string | null) {
  const [links, setLinks] = useState<ProfessionalServiceLink[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!professionalId) {
      setLinks([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("professional_services")
      .select("id, professional_id, service_id, company_id")
      .eq("professional_id", professionalId);
    if (error) toast.error("Não foi possível carregar os serviços");
    else setLinks((data ?? []) as ProfessionalServiceLink[]);
    setLoading(false);
  }, [professionalId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (companyId: string, serviceId: string, currentlyLinked: boolean) => {
      if (!professionalId) return false;
      if (currentlyLinked) {
        const existing = links.find((l) => l.service_id === serviceId);
        if (!existing) return false;
        const { error } = await supabase
          .from("professional_services")
          .delete()
          .eq("id", existing.id);
        if (error) {
          toast.error("Não foi possível remover o serviço");
          return false;
        }
      } else {
        const { error } = await supabase.from("professional_services").insert({
          professional_id: professionalId,
          service_id: serviceId,
          company_id: companyId,
        });
        if (error) {
          toast.error("Não foi possível vincular o serviço");
          return false;
        }
      }
      await refresh();
      return true;
    },
    [professionalId, links, refresh]
  );

  const linkedServiceIds = new Set(links.map((l) => l.service_id));

  return { links, linkedServiceIds, loading, refresh, toggle };
}
