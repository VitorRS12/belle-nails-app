import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearStores, hydrateStores } from "@/lib/storage";
import { toast } from "sonner";

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

    const readOAuthParams = () => {
      const sources = [window.location.hash.replace(/^#/, ""), window.location.search.replace(/^\?/, "")];

      for (const source of sources) {
        if (!source) continue;

        const params = new URLSearchParams(source);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const errorDescription = params.get("error_description") || params.get("error");

        if (errorDescription) {
          return { error: errorDescription, hasOAuthParams: true };
        }

        if (accessToken && refreshToken) {
          return {
            hasOAuthParams: true,
            tokens: {
              access_token: accessToken,
              refresh_token: refreshToken,
            },
          };
        }
      }

      return { hasOAuthParams: false };
    };

    const clearOAuthParamsFromUrl = () => {
      const url = new URL(window.location.href);
      const authKeys = [
        "access_token",
        "refresh_token",
        "expires_at",
        "expires_in",
        "token_type",
        "provider_token",
        "provider_refresh_token",
        "state",
        "error",
        "error_code",
        "error_description",
      ];

      authKeys.forEach((key) => url.searchParams.delete(key));
      url.hash = "";

      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState({}, document.title, nextUrl || "/");
    };

    const bootstrapOAuthSession = async () => {
      const oauth = readOAuthParams();

      if (!oauth.hasOAuthParams) return null;

      clearOAuthParamsFromUrl();

      if (oauth.error) {
        toast.error("Erro ao concluir login com Google");
        return null;
      }

      if (!oauth.tokens) return null;

      const { data, error } = await supabase.auth.setSession(oauth.tokens);

      if (error) {
        toast.error("Erro ao concluir login com Google");
        return null;
      }

      return data.session;
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

    void (async () => {
      const sessionFromOAuth = await bootstrapOAuthSession();
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      const nextSession = data.session ?? sessionFromOAuth;

      setSession((current) => current ?? nextSession);

      if (nextSession?.user) {
        hydrateForUser(nextSession.user.id);
      }

      setLoading(false);
    })();

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
