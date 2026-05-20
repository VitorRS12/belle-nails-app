import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { AreaKey } from "@/lib/types";
import { useProfile } from "@/hooks/useProfile";

interface Ctx {
  area: AreaKey;
  setArea: (a: AreaKey) => void;
  availableAreas: AreaKey[];
}

const ActiveAreaCtx = createContext<Ctx>({
  area: "manicure",
  setArea: () => {},
  availableAreas: ["manicure"],
});

const STORAGE_KEY = "belle:activeArea";

export function ActiveAreaProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile();
  const availableAreas: AreaKey[] = useMemo(
    () => (profile?.areas?.length ? profile.areas : (["manicure"] as AreaKey[])),
    [profile?.areas]
  );

  const [area, setAreaState] = useState<AreaKey>(() => {
    const saved = (typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY)) as AreaKey | null;
    return saved ?? "manicure";
  });

  // Ensure active area is one of the available
  useEffect(() => {
    if (!availableAreas.includes(area)) {
      setAreaState(availableAreas[0]);
    }
  }, [availableAreas, area]);

  // Apply theme attribute on <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-area", area);
    localStorage.setItem(STORAGE_KEY, area);
  }, [area]);

  const setArea = (a: AreaKey) => setAreaState(a);

  return (
    <ActiveAreaCtx.Provider value={{ area, setArea, availableAreas }}>
      {children}
    </ActiveAreaCtx.Provider>
  );
}

export const useActiveArea = () => useContext(ActiveAreaCtx);
