import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Company {
  id: string;
  name: string;
  slug: string;
  segment: string | null;
  timezone: string;
  owner_user_id: string;
}

export function useCompany() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setCompany(null);
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

    if (!member) {
      setCompany(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("companies")
      .select("id, name, slug, segment, timezone, owner_user_id")
      .eq("id", member.company_id)
      .maybeSingle();

    if (!error && data) setCompany(data as Company);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const update = useCallback(
    async (patch: Partial<Pick<Company, "name" | "segment" | "timezone">>) => {
      if (!company) return false;
      const { error } = await supabase
        .from("companies")
        .update(patch)
        .eq("id", company.id);
      if (error) {
        toast.error("Não foi possível salvar as alterações");
        return false;
      }
      setCompany((c) => (c ? { ...c, ...patch } as Company : c));
      toast.success("Empresa atualizada");
      return true;
    },
    [company]
  );

  return { company, loading, refresh, update };
}
