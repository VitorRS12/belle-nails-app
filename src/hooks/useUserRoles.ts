import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "super_admin" | "company_admin" | "professional" | "customer";

export function useUserRoles() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["user_roles", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async (): Promise<AppRole[]> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });

  const roles = query.data ?? [];
  return {
    ...query,
    roles,
    isSuperAdmin: roles.includes("super_admin"),
    isCompanyAdmin: roles.includes("company_admin"),
    isProfessional: roles.includes("professional"),
    isCustomer: roles.includes("customer"),
  };
}

export function useIsSuperAdmin() {
  const { isSuperAdmin, isLoading } = useUserRoles();
  return { isSuperAdmin, isLoading };
}
