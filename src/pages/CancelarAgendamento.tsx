import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, CalendarX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "@/components/LanguageToggle";

type Preview = {
  company: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  alreadyCancelled: boolean;
};

export default function CancelarAgendamento() {
  const { t, i18n } = useTranslation("booking");
  usePageMeta({ title: t("cancel.pageTitle"), description: t("cancel.pageDescription") });
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
        setError(t("cancel.invalidLink"));
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
          if (!res.ok) throw new Error(json.error ?? t("cancel.genericError"));
          setPreview(json);
        } catch (e) {
          setError((e as Error).message || t("cancel.loadError"));
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
      if (!res.ok) throw new Error(json.error ?? t("cancel.genericError"));
      setDone(true);
      toast.success(t("cancel.cancelledToast"));
    } catch (e) {
      toast.error((e as Error).message || t("cancel.cancelError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <CalendarX className="h-5 w-5" /> {t("cancel.title")}
            </span>
            <LanguageToggle />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("cancel.loading")}
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
                    ? t("cancel.alreadyCancelled")
                    : t("cancel.cancelledSuccess")}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("cancel.emailNotice")}
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">{t("cancel.back")}</Link>
              </Button>
            </div>
          ) : preview ? (
            <div className="space-y-4">
              <p>{t("cancel.confirmQuestion")}</p>
              <div className="rounded-lg border p-3 text-sm space-y-1">
                <div><span className="text-muted-foreground">{t("cancel.client")}</span> <strong>{preview.clientName}</strong></div>
                <div><span className="text-muted-foreground">{t("cancel.company")}</span> <strong>{preview.company}</strong></div>
                <div><span className="text-muted-foreground">{t("cancel.service")}</span> <strong>{preview.service}</strong></div>
                <div><span className="text-muted-foreground">{t("cancel.when")}</span> <strong>{new Date(preview.date + "T00:00:00").toLocaleDateString(i18n.resolvedLanguage?.startsWith("en") ? "en-US" : "pt-BR")} {t("cancel.at")} {preview.time}</strong></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild className="flex-1">
                  <Link to="/">{t("cancel.back")}</Link>
                </Button>
                <Button variant="destructive" className="flex-1" disabled={submitting} onClick={confirmCancel}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("cancel.confirmButton")}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
