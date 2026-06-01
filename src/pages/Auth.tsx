import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
    <path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.22-4.74 3.22-8.32z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/>
  </svg>
);

const Auth = () => {
  const { session, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // If already signed in, go home
  useEffect(() => {
    document.title = "Entrar · Belle Nails";
  }, []);

  if (!loading && session) return <Navigate to="/" replace />;

  const signInEmail = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      console.error("signIn failed:", error);
      toast.error("E-mail ou senha incorretos.");
    }
  };

  const signUpEmail = async () => {
    if (!email || !password) return toast.error("Preencha e-mail e senha");
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
      toast.error("Não foi possível criar a conta. Verifique os dados e tente novamente.");
    } else {
      toast.success("Conta criada! Você já pode entrar.");
    }
  };

  const signInGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: {
        prompt: "select_account",
      },
    });

    if (result.error) {
      setBusy(false);
      toast.error("Erro ao entrar com Google");
      return;
    }

    if (!result.redirected) setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-5">
      <div className="w-full max-w-sm space-y-6 animate-fade-in">
        <header className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-elegant">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl">Belle Nails</h1>
          <p className="text-sm text-muted-foreground">
            Sua agenda, seus dados — em qualquer lugar.
          </p>
        </header>

        <div className="rounded-3xl bg-card border border-border/60 p-5 shadow-soft space-y-4">
          {!Capacitor.isNativePlatform() && (
            <>
              <Button
                onClick={signInGoogle}
                disabled={busy}
                variant="outline"
                className="w-full h-11 rounded-xl gap-2"
              >
                <GoogleIcon /> Continuar com Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/60" /></div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-card px-2 text-muted-foreground">ou</span></div>
              </div>
            </>
          )}

          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button onClick={signInEmail} disabled={busy} className="w-full h-11 bg-gradient-primary shadow-elegant">
                Entrar
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label>Seu nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button onClick={signUpEmail} disabled={busy} className="w-full h-11 bg-gradient-primary shadow-elegant">
                Criar conta
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Seus dados ficam protegidos. Cada profissional só vê os próprios clientes.
        </p>
      </div>
    </div>
  );
};

export default Auth;
