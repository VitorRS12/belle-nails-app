import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { ListSkeleton } from "@/components/ListSkeleton";
import { EmptyState } from "@/components/EmptyState";

type LogRow = {
  id: string;
  channel: string;
  template: string;
  recipient: string;
  subject: string | null;
  status: string;
  error: string | null;
  created_at: string;
};

const TEMPLATE_LABEL: Record<string, string> = {
  booking_confirmation_customer: "Confirmação de agendamento (cliente)",
  booking_new_company: "Novo agendamento (empresa)",
  booking_confirmed_customer: "Agendamento confirmado",
  booking_cancelled_customer: "Agendamento cancelado",
  booking_reminder_customer: "Lembrete 24h",
};

const HistoricoNotificacoes = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data: member } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      const companyId = member?.company_id;
      if (!companyId) {
        if (active) setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("notification_log")
        .select("id, channel, template, recipient, subject, status, error, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (!active) return;
      if (!error && data) setRows(data as LogRow[]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <AppLayout subtitle="Configurações" title="Histórico de notificações">
      {loading ? (
        <ListSkeleton rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-5 w-5" />}
          title="Nenhuma notificação enviada ainda"
          description="Quando um cliente agendar pelo seu site ou você confirmar / cancelar um atendimento, os e-mails aparecerão aqui."
        />
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => {
            const ok = r.status === "sent";
            return (
              <li
                key={r.id}
                className="rounded-2xl bg-card border border-border/60 p-4 shadow-soft"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`h-9 w-9 rounded-full inline-flex items-center justify-center ${
                      ok
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {ok ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display text-sm">
                        {TEMPLATE_LABEL[r.template] ?? r.template}
                      </span>
                      <span
                        className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          ok
                            ? "bg-primary/10 text-primary"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {ok ? "Enviado" : r.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-1 truncate">
                      <Mail className="h-3 w-3" /> {r.recipient}
                    </p>
                    {r.subject && (
                      <p className="text-xs text-foreground/80 truncate mt-0.5">{r.subject}</p>
                    )}
                    {!ok && r.error && (
                      <p className="text-[11px] text-destructive mt-1 line-clamp-2">{r.error}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(parseISO(r.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppLayout>
  );
};

export default HistoricoNotificacoes;
