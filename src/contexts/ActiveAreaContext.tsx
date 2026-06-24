import { createContext, useContext, useEffect, ReactNode } from "react";
import type { AreaKey } from "@/lib/types";
import { useProfile } from "@/hooks/useProfile";

interface Ctx {
  area: AreaKey;
}

const ActiveAreaCtx = createContext<Ctx>({ area: "manicure" });

export function ActiveAreaProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile();
  const area: AreaKey = profile?.area ?? "manicure";

  useEffect(() => {
    document.documentElement.setAttribute("data-area", area);
  }, [area]);

  return <ActiveAreaCtx.Provider value={{ area }}>{children}</ActiveAreaCtx.Provider>;
}

export const useActiveArea = () => useContext(ActiveAreaCtx);
