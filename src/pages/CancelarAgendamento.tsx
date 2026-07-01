import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, CalendarX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";

type Preview = {
  company: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  alreadyCancelled: boolean;
};

export default function CancelarAgendamento() {
  usePageMeta({ title: "Cancelar agendamento — Belle Nails", description: "Cancele seu agendamento com um clique." });
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      if (!token) {
        setError("Link inválido.");
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke("public-cancel-booking", {
          method: "GET" as never,
          body: undefined,
          headers: {},
          // supabase-js doesn't support GET query params well; use fetch fallback
        } as never);
        if (error || !data) throw error;
        setPreview(data as Preview);
      } catch {
        try {
          const url = `${(supabase as unknown as { supabaseUrl: string }).supabaseUrl}/functions/v1/public-cancel-booking?token=${encodeURIComponent(token)}`;
          const res = await fetch(url);
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? "Erro");
          setPreview(json);
        } catch (e) {
          setError((e as Error).message || "Não foi possível carregar o agendamento.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function confirmCancel() {
    setSubmitting(true);
    try {
      const url = `${(supabase as unknown as { supabaseUrl: string }).supabaseUrl}/functions/v1/public-cancel-booking`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro");
      setDone(true);
      toast.success("Agendamento cancelado.");
    } catch (e) {
      toast.error((e as Error).message || "Não foi possível cancelar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarX className="h-5 w-5" /> Cancelar agendamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
            </div>
          ) : error ? (
            <div className="flex items-start gap-2 text-destructive">
              <XCircle className="h-5 w-5 mt-0.5" /> <p>{error}</p>
            </div>
          ) : done || preview?.alreadyCancelled ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-medium">
                  {preview?.alreadyCancelled && !done
                    ? "Este agendamento já estava cancelado."
                    : "Agendamento cancelado com sucesso."}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Um e-mail de confirmação foi enviado para você e para a profissional.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">Voltar</Link>
              </Button>
            </div>
          ) : preview ? (
            <div className="space-y-4">
              <p>Confirma o cancelamento do agendamento abaixo?</p>
              <div className="rounded-lg border p-3 text-sm space-y-1">
                <div><span className="text-muted-foreground">Cliente:</span> <strong>{preview.clientName}</strong></div>
                <div><span className="text-muted-foreground">Empresa:</span> <strong>{preview.company}</strong></div>
                <div><span className="text-muted-foreground">Serviço:</span> <strong>{preview.service}</strong></div>
                <div><span className="text-muted-foreground">Quando:</span> <strong>{new Date(preview.date + "T00:00:00").toLocaleDateString("pt-BR")} às {preview.time}</strong></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild className="flex-1">
                  <Link to="/">Voltar</Link>
                </Button>
                <Button variant="destructive" className="flex-1" disabled={submitting} onClick={confirmCancel}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancelar agendamento"}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
