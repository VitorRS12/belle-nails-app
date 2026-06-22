import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp, type URLOpenListenerEvent } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
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
    let appUrlListener: { remove: () => Promise<void> } | null = null;

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

    const handleNativeOAuthUrl = async (rawUrl?: string | null) => {
      if (!rawUrl) return null;

      const normalizedUrl = rawUrl.replace("#", "?");
      const url = new URL(normalizedUrl);
      const isNativeCallback = url.protocol === "app.lovable.bellenails:" && url.hostname === "oauth-callback";

      if (!isNativeCallback) return null;

      const errorDescription = url.searchParams.get("error_description") || url.searchParams.get("error");

      await Browser.close().catch(() => undefined);

      if (errorDescription) {
        toast.error("Erro ao concluir login com Google");
        return null;
      }

      const accessToken = url.searchParams.get("access_token");
      const refreshToken = url.searchParams.get("refresh_token");

      if (!accessToken || !refreshToken) return null;

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

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
      let sessionFromOAuth = await bootstrapOAuthSession();

      if (!sessionFromOAuth && Capacitor.isNativePlatform()) {
        const launchUrl = await CapacitorApp.getLaunchUrl();
        sessionFromOAuth = await handleNativeOAuthUrl(launchUrl?.url);

        appUrlListener = await CapacitorApp.addListener("appUrlOpen", async (event: URLOpenListenerEvent) => {
          const nextSession = await handleNativeOAuthUrl(event.url);

          if (!mounted || !nextSession) return;

          setSession(nextSession);
          hydrateForUser(nextSession.user.id);
          setLoading(false);
        });
      }

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
      void appUrlListener?.remove();
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    try {
      localStorage.removeItem("bn:guest");
    } catch {
      // ignore
    }
    clearStores();
  };

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
