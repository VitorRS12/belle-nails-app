import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProfessionalSchedule {
  id: string;
  professional_id: string;
  company_id: string;
  weekday: number; // 0..6 (0 = Sunday)
  start_time: string; // "HH:MM:SS"
  end_time: string;
}

export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function useProfessionalSchedules(professionalId: string | null) {
  const [schedules, setSchedules] = useState<ProfessionalSchedule[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!professionalId) {
      setSchedules([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("professional_schedules")
      .select("id, professional_id, company_id, weekday, start_time, end_time")
      .eq("professional_id", professionalId)
      .order("weekday")
      .order("start_time");
    if (error) toast.error("Não foi possível carregar a jornada");
    else setSchedules((data ?? []) as ProfessionalSchedule[]);
    setLoading(false);
  }, [professionalId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (companyId: string, weekday: number, start: string, end: string) => {
      if (!professionalId) return false;
      const { error } = await supabase.from("professional_schedules").insert({
        professional_id: professionalId,
        company_id: companyId,
        weekday,
        start_time: start,
        end_time: end,
      });
      if (error) {
        toast.error("Não foi possível adicionar a jornada");
        return false;
      }
      await refresh();
      return true;
    },
    [professionalId, refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("professional_schedules").delete().eq("id", id);
      if (error) {
        toast.error("Não foi possível remover");
        return false;
      }
      await refresh();
      return true;
    },
    [refresh]
  );

  return { schedules, loading, refresh, add, remove };
}
