import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { enableGuestMode, isGuestMode } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "@/components/LanguageToggle";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
    <path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.22-4.74 3.22-8.32z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/>
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="currentColor">
    <path d="M16.365 1.43c0 1.14-.42 2.22-1.24 3.03-.87.87-2.29 1.55-3.44 1.45-.14-1.13.42-2.28 1.19-3.04.87-.86 2.35-1.5 3.49-1.44zM20.5 17.53c-.56 1.29-.83 1.87-1.55 3.01-1 1.6-2.41 3.59-4.16 3.6-1.55.02-1.95-1.01-4.06-.99-2.11.01-2.55 1.01-4.1.99-1.75-.02-3.09-1.82-4.09-3.42-2.8-4.47-3.09-9.72-1.36-12.51C2.4 6.29 4.32 5.13 6.13 5.13c1.85 0 3.01 1.02 4.54 1.02 1.49 0 2.4-1.02 4.54-1.02 1.62 0 3.34.88 4.56 2.4-4.01 2.2-3.36 7.94.73 10z"/>
  </svg>
);

const NATIVE_GOOGLE_REDIRECT_URI = "app.lovable.bellenails://oauth-callback";

const Auth = () => {
  const { t } = useTranslation("auth");
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // If already signed in, go home
  useEffect(() => {
    document.title = t("meta.title");
  }, [t]);

  if (!loading && session) return <Navigate to="/inicio" replace />;
  if (!loading && !session && isGuestMode()) return <Navigate to="/inicio" replace />;

  const continueOffline = () => {
    enableGuestMode();
    toast.success(t("offline.toastTitle"), {
      description: t("offline.toastDescription"),
    });
    navigate("/inicio", { replace: true });
  };


  const signInEmail = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      console.error("signIn failed:", error);
      toast.error(t("errors.invalidCredentials"));
    }
  };

  const signUpEmail = async () => {
    if (!email || !password) return toast.error(t("errors.fillEmailPassword"));
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: name || undefined },
      },
    });
    setBusy(false);
    if (error) {
      console.error("signUp failed:", error);
      toast.error(t("errors.signUpFailed"));
    } else {
      toast.success(t("success.signUp"));
    }
  };

  const signInGoogle = async () => {
    setBusy(true);

    try {
      if (Capacitor.isNativePlatform()) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: NATIVE_GOOGLE_REDIRECT_URI,
            skipBrowserRedirect: true,
            queryParams: { prompt: "select_account" },
          },
        });

        if (error || !data?.url) {
          setBusy(false);
          toast.error(t("errors.googleSignIn"));
          return;
        }

        await Browser.open({ url: data.url, presentationStyle: "popover" });
        setBusy(false);
        return;
      }

      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: {
          prompt: "select_account",
        },
      });

      if (result.error) {
        setBusy(false);
        toast.error(t("errors.googleSignIn"));
        return;
      }

      if (!result.redirected) setBusy(false);
    } catch (error) {
      console.error("google sign in failed:", error);
      setBusy(false);
      toast.error(t("errors.googleSignIn"));
    }
  };

  const signInApple = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setBusy(false);
        toast.error(t("errors.appleSignIn"));
        return;
      }
      if (!result.redirected) setBusy(false);
    } catch (error) {
      console.error("apple sign in failed:", error);
      setBusy(false);
      toast.error(t("errors.appleSignIn"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-5">
      <div className="w-full max-w-sm space-y-6 animate-fade-in">
        <div className="flex justify-end">
          <LanguageToggle variant="full" />
        </div>

        <header className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-elegant">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl">{t("header.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("header.subtitle")}
          </p>
        </header>

        <div className="rounded-3xl bg-card border border-border/60 p-5 shadow-soft space-y-4">
          <Button
            onClick={signInGoogle}
            disabled={busy}
            variant="outline"
            className="w-full h-11 rounded-xl gap-2"
          >
            <GoogleIcon /> {t("buttons.continueWithGoogle")}
          </Button>

          <Button
            onClick={signInApple}
            disabled={busy}
            variant="outline"
            className="w-full h-11 rounded-xl gap-2"
          >
            <AppleIcon /> {t("buttons.continueWithApple")}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/60" /></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-card px-2 text-muted-foreground">{t("buttons.or")}</span></div>
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">{t("buttons.signIn")}</TabsTrigger>
              <TabsTrigger value="signup">{t("buttons.signUp")}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label>{t("fields.email")}</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("fields.password")}</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button onClick={signInEmail} disabled={busy} className="w-full h-11 bg-gradient-primary shadow-elegant">
                {t("buttons.signIn")}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label>{t("fields.name")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("fields.email")}</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("fields.password")}</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button onClick={signUpEmail} disabled={busy} className="w-full h-11 bg-gradient-primary shadow-elegant">
                {t("buttons.createAccount")}
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        <Button
          variant="ghost"
          onClick={continueOffline}
          className="w-full h-11 rounded-xl gap-2 text-muted-foreground hover:text-foreground"
        >
          <WifiOff className="h-4 w-4" /> {t("buttons.useOffline")}
        </Button>

        <p className="text-center text-[11px] text-muted-foreground">
          {t("footer.privacy")}
        </p>
      </div>
    </div>
  );
};

export default Auth;
