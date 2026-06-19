// Backwards-compatible shim over the new `services` table.
// AppointmentForm and Equipe still use this hook; the catalog is now unified.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { AreaKey } from "@/lib/types";
import { toast } from "sonner";

export interface CustomService {
  id: string;
  area: AreaKey; // legacy; defaults to "manicure" since services no longer track area
  name: string;
  price: number;
}

export function useCustomServices() {
  const { user } = useAuth();
  const [services, setServices] = useState<CustomService[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setServices([]);
      setCompanyId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: member } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    setCompanyId(member?.company_id ?? null);

    const { data, error } = await supabase
      .from("services")
      .select("id, name, price")
      .eq("active", true)
      .order("name");
    if (!error && data) {
      setServices(
        data.map((d) => ({
          id: d.id,
          area: "manicure" as AreaKey,
          name: d.name,
          price: Number(d.price) || 0,
        })),
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (_area: AreaKey, name: string, price: number) => {
      if (!user || !companyId) return null;
      const clean = name.trim();
      if (!clean) return null;
      const { data, error } = await supabase
        .from("services")
        .insert({ company_id: companyId, name: clean, price, duration_minutes: 60, active: true })
        .select("id, name, price")
        .single();
      if (error || !data) {
        toast.error("Não foi possível salvar o serviço");
        return null;
      }
      const saved: CustomService = {
        id: data.id,
        area: "manicure",
        name: data.name,
        price: Number(data.price) || 0,
      };
      setServices((cur) => [...cur, saved].sort((a, b) => a.name.localeCompare(b.name)));
      return saved;
    },
    [user, companyId],
  );

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível remover o serviço");
      return false;
    }
    setServices((cur) => cur.filter((s) => s.id !== id));
    return true;
  }, []);

  return { services, loading, refresh, add, remove };
}
