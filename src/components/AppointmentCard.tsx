import { Appointment } from "@/lib/types";
import { Clock, Pencil, Trash2, CheckCircle2, XCircle, CalendarClock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { appointmentsStore } from "@/lib/storage";
import { AppointmentForm } from "./AppointmentForm";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const statusLabel: Record<Appointment["status"], string> = {
  scheduled: "Agendado",
  completed: "Concluído",
  cancelled: "Cancelado",
  pendente_confirmacao: "Aguardando confirmação",
};

const statusStyles: Record<Appointment["status"], string> = {
  scheduled: "bg-accent-soft text-accent-foreground",
  completed: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
  pendente_confirmacao: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
};

export function AppointmentCard({
  appt,
  showDate = false,
  showStatusActions = false,
}: {
  appt: Appointment;
  showDate?: boolean;
  showStatusActions?: boolean;
}) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [newDate, setNewDate] = useState(appt.date);
  const [newTime, setNewTime] = useState(appt.time);
  const [extraValue, setExtraValue] = useState("");
  const [extraReason, setExtraReason] = useState("");

  const remove = () => {
    if (!confirm("Remover este atendimento?")) return;
    appointmentsStore.remove(appt.id);
    toast.success("Removido");
  };

  const cancel = () => {
    if (!confirm("Cancelar este serviço?")) return;
    appointmentsStore.save({ ...appt, status: "cancelled" });
    toast.success("Atendimento cancelado");
  };

  const confirmComplete = () => {
    const extra = Number(extraValue) || 0;
    appointmentsStore.save({
      ...appt,
      status: "completed",
      completedAt: new Date().toISOString(),
      extraValue: extra > 0 ? extra : undefined,
      extraReason: extra > 0 ? (extraReason.trim() || undefined) : undefined,
      price: appt.price + extra,
    });
    toast.success("Marcado como concluído ✨");
    setCompleteOpen(false);
    setExtraValue("");
    setExtraReason("");
  };

  const reschedule = () => {
    appointmentsStore.save({ ...appt, date: newDate, time: newTime, status: "scheduled" });
    toast.success("Reagendado!");
    setRescheduleOpen(false);
  };

  const showQuickActions = showStatusActions && appt.status === "scheduled";

  return (
    <>
      <article className="group rounded-2xl bg-card border border-border/60 p-4 shadow-soft hover:shadow-elegant transition-smooth animate-scale-in text-left w-full">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full", statusStyles[appt.status])}>
                {statusLabel[appt.status]}
              </span>
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {showDate && format(parseISO(appt.date), "dd MMM", { locale: ptBR }) + " · "}
                {appt.time}
              </span>
            </div>
            <h3 className="font-display text-lg leading-tight truncate">{appt.clientName}</h3>
            <p className="text-sm text-muted-foreground truncate">{appt.service}</p>
            {appt.extraValue ? (
              <p className="text-[11px] text-primary mt-1">
                +R$ {appt.extraValue.toFixed(2).replace(".", ",")}
                {appt.extraReason ? ` · ${appt.extraReason}` : ""}
              </p>
            ) : null}
            {appt.materials.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {appt.materials.map((m, i) => (
                  <span key={i} className="text-[10px] rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
                    {m.name}{m.quantity ? ` · ${m.quantity}` : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="font-display text-lg text-primary whitespace-nowrap">
              R$ {appt.price.toFixed(2).replace(".", ",")}
            </span>
            <div className="flex gap-1">
              <AppointmentForm
                initial={appt}
                trigger={
                  <button className="h-7 w-7 rounded-full bg-secondary hover:bg-accent-soft inline-flex items-center justify-center transition-smooth">
                    <Pencil className="h-3 w-3" />
                  </button>
                }
              />
              <button
                onClick={remove}
                className="h-7 w-7 rounded-full bg-secondary hover:bg-destructive/10 hover:text-destructive inline-flex items-center justify-center transition-smooth"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {showQuickActions && (
          <div className="mt-3 pt-3 border-t border-border/60 grid grid-cols-3 gap-2">
            <Button
              size="sm"
              onClick={() => setCompleteOpen(true)}
              className="bg-gradient-primary shadow-soft h-9 text-xs"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" /> Concluir
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setRescheduleOpen(true)}
              className="h-9 text-xs"
            >
              <CalendarClock className="h-4 w-4 mr-1" /> Adiar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={cancel}
              className="h-9 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
            >
              <XCircle className="h-4 w-4 mr-1" /> Cancelar
            </Button>
          </div>
        )}
      </article>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Adiar / Reagendar</DialogTitle>
            <DialogDescription>Escolha a nova data e horário.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
            </div>
          </div>
          <Button onClick={reschedule} className="w-full bg-gradient-primary h-11 shadow-elegant mt-2">
            Confirmar novo horário
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Concluir atendimento</DialogTitle>
            <DialogDescription>
              {appt.service} · R$ {appt.price.toFixed(2).replace(".", ",")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label>Valor extra (opcional)</Label>
              <Input
                inputMode="decimal"
                placeholder="0,00"
                value={extraValue}
                onChange={(e) => setExtraValue(e.target.value.replace(",", "."))}
              />
            </div>
            {Number(extraValue) > 0 && (
              <div className="space-y-2 animate-scale-in">
                <Label>Motivo do valor extra</Label>
                <Textarea
                  placeholder="Ex: decoração especial, alongamento adicional…"
                  rows={2}
                  value={extraReason}
                  onChange={(e) => setExtraReason(e.target.value)}
                />
              </div>
            )}
            <div className="rounded-2xl bg-gradient-soft p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total final</p>
              <p className="font-display text-2xl text-primary">
                R$ {(appt.price + (Number(extraValue) || 0)).toFixed(2).replace(".", ",")}
              </p>
            </div>
            <Button onClick={confirmComplete} className="w-full bg-gradient-primary h-11 shadow-elegant">
              <CheckCircle2 className="h-5 w-5 mr-2" /> Confirmar conclusão
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
