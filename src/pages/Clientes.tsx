import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/AppLayout";
import { useAppointments, useClients } from "@/hooks/useStore";
import { clientsStore, uid } from "@/lib/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Search, Trash2, Phone, Sparkles, Pencil, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import type { Client, Appointment } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import i18n from "@/i18n";

function ClientForm({ initial, trigger }: { initial?: Client; trigger?: React.ReactNode }) {
  const { t } = useTranslation("app");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const save = () => {
    if (!name.trim()) return toast.error(t("clients.form.nameRequired"));
    clientsStore.save({
      id: initial?.id ?? uid(),
      name: name.trim(),
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    });
    toast.success(t("clients.form.saved"));
    setOpen(false);
    if (!initial) {
      setName(""); setPhone(""); setNotes("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="icon" className="h-11 w-11 rounded-full bg-gradient-primary shadow-elegant">
            <Plus className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {initial ? t("clients.form.editTitle") : t("clients.form.newTitle")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-2"><Label>{t("clients.form.name")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label>{t("clients.form.phone")}</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div className="space-y-2"><Label>{t("clients.form.notes")}</Label><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <Button onClick={save} className="w-full bg-gradient-primary h-11 shadow-elegant">{t("clients.form.save")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ClientDetail({
  client,
  appts,
  open,
  onOpenChange,
}: {
  client: Client;
  appts: Appointment[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation("app");
  const dateLocale = i18n.resolvedLanguage === "en" ? enUS : ptBR;
  const completed = appts.filter((a) => a.status === "completed");
  const total = completed.reduce((s, a) => s + a.price, 0);
  const sortedCompleted = [...completed].sort((a, b) => {
    const ka = a.completedAt ?? `${a.date}T${a.time}`;
    const kb = b.completedAt ?? `${b.date}T${b.time}`;
    return kb.localeCompare(ka);
  });
  const last = sortedCompleted[0];
  const lastDate = last ? (last.completedAt ? parseISO(last.completedAt) : parseISO(last.date)) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-display text-lg shrink-0">
              {client.name.charAt(0).toUpperCase()}
            </div>
            {client.name}
          </DialogTitle>
          {client.phone && (
            <DialogDescription className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3" /> {client.phone}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="rounded-2xl bg-gradient-soft p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("clients.detail.services")}</p>
            <p className="font-display text-xl text-primary">{completed.length}</p>
          </div>
          <div className="rounded-2xl bg-gradient-soft p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("clients.detail.total")}</p>
            <p className="font-display text-xl text-primary">R$ {total.toFixed(2).replace(".", ",")}</p>
          </div>
          <div className="rounded-2xl bg-gradient-soft p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("clients.detail.last")}</p>
            <p className="font-display text-sm text-primary leading-tight pt-1">
              {lastDate ? format(lastDate, "dd/MM/yy") : "—"}
            </p>
          </div>
        </div>

        {client.notes && (
          <div className="rounded-2xl bg-secondary/60 p-3 text-sm">{client.notes}</div>
        )}

        <div className="space-y-2 pt-1">
          <h3 className="font-display text-lg flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-accent" /> {t("clients.detail.history")}
          </h3>
          {sortedCompleted.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-2xl bg-card/60 border border-dashed border-border p-4 text-center">
              {t("clients.detail.noCompleted")}
            </p>
          ) : (
            <div className="space-y-2">
              {sortedCompleted.map((a) => {
                const completedDate = a.completedAt ? parseISO(a.completedAt) : parseISO(a.date);
                return (
                  <div key={a.id} className="rounded-xl bg-card border border-border/60 p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{a.service}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("clients.detail.completedOn", {
                            date: format(completedDate, "dd 'de' MMM yyyy", { locale: dateLocale }),
                          })}
                        </p>
                        {a.extraValue ? (
                          <p className="text-[11px] text-primary mt-0.5">
                            +R$ {a.extraValue.toFixed(2).replace(".", ",")}
                            {a.extraReason ? ` · ${a.extraReason}` : ""}
                          </p>
                        ) : null}
                      </div>
                      <span className="font-display text-primary text-sm whitespace-nowrap">
                        R$ {a.price.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const Clientes = () => {
  const { t } = useTranslation("app");
  const clients = useClients();
  const appts = useAppointments();
  const [q, setQ] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const list = useMemo(() => {
    const enriched = clients.map((c) => {
      const completedAppts = appts.filter((a) => a.clientId === c.id && a.status === "completed");
      const total = completedAppts.reduce((s, a) => s + a.price, 0);
      return { ...c, count: completedAppts.length, total };
    });
    return enriched
      .filter((c) => (q.trim() ? c.name.toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, appts, q]);

  const remove = (id: string) => {
    if (!confirm(t("clients.removeConfirm"))) return;
    clientsStore.remove(id);
    toast.success(t("clients.removed"));
  };

  const detailClient = clients.find((c) => c.id === detailId);
  const detailAppts = detailId ? appts.filter((a) => a.clientId === detailId) : [];

  return (
    <AppLayout subtitle={t("clients.subtitle")} title={t("clients.title")} action={<ClientForm />}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 rounded-full"
          placeholder={t("clients.searchPlaceholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl bg-card/60 border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t("clients.empty")}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <button
              key={c.id}
              onClick={() => setDetailId(c.id)}
              className="w-full text-left rounded-2xl bg-card border border-border/60 p-4 shadow-soft hover:shadow-elegant transition-smooth animate-scale-in"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-display text-lg shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg leading-tight truncate">{c.name}</h3>
                    {c.phone && (
                      <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {c.phone}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                      <Sparkles className="h-3 w-3" />{" "}
                      {t("clients.appointmentsCount", { count: c.count })} · R$ {c.total.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <ClientForm
                    initial={c}
                    trigger={
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="h-7 w-7 rounded-full bg-secondary hover:bg-accent-soft inline-flex items-center justify-center"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    }
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(c.id); }}
                    className="h-7 w-7 rounded-full bg-secondary hover:bg-destructive/10 hover:text-destructive inline-flex items-center justify-center"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {detailClient && (
        <ClientDetail
          client={detailClient}
          appts={detailAppts}
          open={!!detailId}
          onOpenChange={(o) => !o && setDetailId(null)}
        />
      )}
    </AppLayout>
  );
};

export default Clientes;
