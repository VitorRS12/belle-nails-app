import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { AreaKey } from "@/lib/types";

export interface Profile {
  user_id: string;
  display_name: string | null;
  area: AreaKey;
}

const VALID_AREAS: AreaKey[] = ["manicure", "cilios", "sobrancelhas"];
function normalizeArea(value: unknown): AreaKey {
  return VALID_AREAS.includes(value as AreaKey) ? (value as AreaKey) : "manicure";
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
      .select("user_id, display_name, area")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!error && data) {
      setProfile({
        user_id: data.user_id,
        display_name: data.display_name,
        area: normalizeArea(data.area),
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateArea = useCallback(
    async (area: AreaKey) => {
      if (!user) return false;
      const safe = normalizeArea(area);
      const { error } = await supabase
        .from("profiles")
        .update({ area: safe })
        .eq("user_id", user.id);
      if (!error) setProfile((p) => (p ? { ...p, area: safe } : p));
      return !error;
    },
    [user]
  );

  return { profile, loading, refresh, updateArea };
}
