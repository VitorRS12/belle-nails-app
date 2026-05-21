import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearStores, hydrateStores } from "@/lib/storage";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null, user: null, loading: true, signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const hydratedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const hydrateForUser = (userId: string) => {
      if (hydratedUserIdRef.current === userId) return;
      hydratedUserIdRef.current = userId;
      setTimeout(() => {
        void hydrateStores(userId);
      }, 0);
    };

    const clearAuthState = () => {
      hydratedUserIdRef.current = null;
      clearStores();
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);
      setLoading(false);

      if (nextSession?.user) {
        hydrateForUser(nextSession.user.id);
      } else {
        clearAuthState();
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;

      setSession((current) => current ?? data.session);

      if (data.session?.user) {
        hydrateForUser(data.session.user.id);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    clearStores();
  };

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
