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

const statusLabel: Record<Appointment["status"], string> = {
  scheduled: "Agendado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const statusStyles: Record<Appointment["status"], string> = {
  scheduled: "bg-accent-soft text-accent-foreground",
  completed: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
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
  const [actionsOpen, setActionsOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState(appt.date);
  const [newTime, setNewTime] = useState(appt.time);

  const remove = () => {
    if (!confirm("Remover este atendimento?")) return;
    appointmentsStore.remove(appt.id);
    toast.success("Removido");
  };

  const setStatus = (status: Appointment["status"]) => {
    appointmentsStore.save({ ...appt, status });
    toast.success(
      status === "completed"
        ? "Marcado como concluído ✨"
        : status === "cancelled"
        ? "Atendimento cancelado"
        : "Atendimento reagendado"
    );
    setActionsOpen(false);
  };

  const reschedule = () => {
    appointmentsStore.save({ ...appt, date: newDate, time: newTime, status: "scheduled" });
    toast.success("Reagendado!");
    setRescheduleOpen(false);
    setActionsOpen(false);
  };

  const clickable = showStatusActions && appt.status === "scheduled";

  const cardContent = (
    <article className="group rounded-2xl bg-card border border-border/60 p-4 shadow-soft hover:shadow-elegant transition-smooth animate-scale-in text-left w-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
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
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="h-7 w-7 rounded-full bg-secondary hover:bg-accent-soft inline-flex items-center justify-center transition-smooth"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              }
            />
            <button
              onClick={(e) => { e.stopPropagation(); remove(); }}
              className="h-7 w-7 rounded-full bg-secondary hover:bg-destructive/10 hover:text-destructive inline-flex items-center justify-center transition-smooth"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );

  if (!clickable) return cardContent;

  return (
    <>
      <button type="button" onClick={() => setActionsOpen(true)} className="block w-full">
        {cardContent}
      </button>

      <Dialog open={actionsOpen} onOpenChange={setActionsOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{appt.clientName}</DialogTitle>
            <DialogDescription>
              {appt.service} · {format(parseISO(appt.date), "dd 'de' MMMM", { locale: ptBR })} às {appt.time}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            <Button
              onClick={() => setStatus("completed")}
              className="w-full justify-start h-12 bg-gradient-primary shadow-elegant"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" /> Marcar como concluído
            </Button>
            <Button
              onClick={() => setRescheduleOpen(true)}
              variant="secondary"
              className="w-full justify-start h-12"
            >
              <CalendarClock className="h-5 w-5 mr-2" /> Adiar / Reagendar
            </Button>
            <Button
              onClick={() => setStatus("cancelled")}
              variant="outline"
              className="w-full justify-start h-12 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
            >
              <XCircle className="h-5 w-5 mr-2" /> Cancelar serviço
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Reagendar</DialogTitle>
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
    </>
  );
}
