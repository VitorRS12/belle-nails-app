import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "super_admin" | "company_admin" | "professional" | "customer";

export function useUserRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }
    let mounted = true;
    void (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (!mounted) return;
      setRoles((data ?? []).map((r) => r.role as AppRole));
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  return {
    roles,
    loading,
    hasRole: (r: AppRole) => roles.includes(r),
    isSuperAdmin: roles.includes("super_admin"),
    isCompanyAdmin: roles.includes("company_admin"),
  };
}
