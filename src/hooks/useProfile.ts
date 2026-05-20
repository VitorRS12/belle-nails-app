import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { AreaKey } from "@/lib/types";

export interface Profile {
  user_id: string;
  display_name: string | null;
  areas: AreaKey[];
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, display_name, areas")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!error && data) {
      setProfile({
        user_id: data.user_id,
        display_name: data.display_name,
        areas: (data.areas ?? ["manicure"]) as AreaKey[],
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateAreas = useCallback(
    async (areas: AreaKey[]) => {
      if (!user) return;
      const safe = areas.length > 0 ? areas : (["manicure"] as AreaKey[]);
      const { error } = await supabase
        .from("profiles")
        .update({ areas: safe })
        .eq("user_id", user.id);
      if (!error) setProfile((p) => (p ? { ...p, areas: safe } : p));
      return !error;
    },
    [user]
  );

  return { profile, loading, refresh, updateAreas };
}
