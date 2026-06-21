import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DayBlock {
  id: string;
  professional_id: string;
  company_id: string;
  blocked_date: string; // yyyy-MM-dd
  reason: string | null;
}

export function useProfessionalDayBlocks(professionalId: string | null) {
  const [blocks, setBlocks] = useState<DayBlock[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!professionalId) {
      setBlocks([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("professional_day_blocks")
      .select("id, professional_id, company_id, blocked_date, reason")
      .eq("professional_id", professionalId)
      .order("blocked_date");
    if (error) toast.error("Não foi possível carregar os bloqueios");
    else setBlocks((data ?? []) as DayBlock[]);
    setLoading(false);
  }, [professionalId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const block = useCallback(
    async (companyId: string, date: string, reason?: string) => {
      if (!professionalId) return false;
      const { error } = await supabase.from("professional_day_blocks").insert({
        professional_id: professionalId,
        company_id: companyId,
        blocked_date: date,
        reason: reason?.trim() || null,
      });
      if (error) {
        if (error.code === "23505") {
          toast.error("Este dia já está bloqueado");
        } else {
          toast.error("Não foi possível bloquear o dia");
        }
        return false;
      }
      await refresh();
      return true;
    },
    [professionalId, refresh]
  );

  const unblock = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("professional_day_blocks").delete().eq("id", id);
      if (error) {
        toast.error("Não foi possível desbloquear");
        return false;
      }
      await refresh();
      return true;
    },
    [refresh]
  );

  return { blocks, loading, refresh, block, unblock };
}
