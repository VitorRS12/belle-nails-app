import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";
import { toast } from "sonner";

export interface Professional {
  id: string;
  company_id: string;
  user_id: string | null;
  name: string;
  photo_url: string | null;
  bio: string | null;
  specialties: string[];
  areas: string[];
  active: boolean;
  email: string | null;
  created_at: string;
}

export type ProfessionalInput = {
  name: string;
  bio?: string | null;
  photo_url?: string | null;
  specialties?: string[];
  areas?: string[];
  active?: boolean;
};

export function useProfessionals() {
  const { company } = useCompany();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!company) {
      setProfessionals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("professionals")
      .select("id, company_id, user_id, name, photo_url, bio, specialties, areas, active, email, created_at")
      .eq("company_id", company.id)
      .order("created_at", { ascending: true });
    if (error) {
      toast.error("Não foi possível carregar a equipe");
      setProfessionals([]);
    } else {
      setProfessionals((data ?? []) as Professional[]);
    }
    setLoading(false);
  }, [company]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: ProfessionalInput): Promise<Professional | null> => {
      if (!company) return null;
      const { data, error } = await supabase.from("professionals").insert({
        company_id: company.id,
        name: input.name,
        bio: input.bio ?? null,
        photo_url: input.photo_url ?? null,
        specialties: input.specialties ?? [],
        areas: input.areas ?? [],
        active: input.active ?? true,
      })
        .select("id, company_id, user_id, name, photo_url, bio, specialties, areas, active, email, created_at")
        .maybeSingle();
      if (error || !data) {
        toast.error("Não foi possível cadastrar a profissional");
        return null;
      }
      toast.success("Profissional cadastrada");
      await refresh();
      return data as Professional;
    },
    [company, refresh]
  );

  const update = useCallback(
    async (id: string, patch: Partial<ProfessionalInput>) => {
      const { error } = await supabase
        .from("professionals")
        .update(patch)
        .eq("id", id);
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
      const { error } = await supabase.from("professionals").delete().eq("id", id);
      if (error) {
        toast.error("Não foi possível remover");
        return false;
      }
      toast.success("Profissional removida");
      await refresh();
      return true;
    },
    [refresh]
  );

  return { professionals, loading, refresh, create, update, remove };
}
