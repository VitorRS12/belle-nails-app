import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { AreaKey } from "@/lib/types";
import { toast } from "sonner";

export interface CustomService {
  id: string;
  area: AreaKey;
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
      .from("custom_services")
      .select("id, area, name, price")
      .order("name");
    if (!error && data) {
      setServices(
        data.map((d) => ({
          id: d.id,
          area: d.area as AreaKey,
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
    async (area: AreaKey, name: string, price: number) => {
      if (!user || !companyId) return null;
      const clean = name.trim();
      if (!clean) return null;
      const { data, error } = await supabase
        .from("custom_services")
        .upsert(
          { user_id: user.id, company_id: companyId, area, name: clean, price } as never,
          { onConflict: "user_id,area,name" },
        )
        .select("id, area, name, price")
        .single();
      if (error || !data) {
        toast.error("Não foi possível salvar o serviço");
        return null;
      }
      const saved: CustomService = {
        id: data.id,
        area: data.area as AreaKey,
        name: data.name,
        price: Number(data.price) || 0,
      };
      setServices((cur) => {
        const without = cur.filter(
          (s) => !(s.area === saved.area && s.name === saved.name),
        );
        return [...without, saved].sort((a, b) => a.name.localeCompare(b.name));
      });
      return saved;
    },
    [user, companyId],
  );

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from("custom_services").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível remover o serviço");
      return false;
    }
    setServices((cur) => cur.filter((s) => s.id !== id));
    return true;
  }, []);

  return { services, loading, refresh, add, remove };
}
