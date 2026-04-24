import { Appointment } from "@/lib/types";
import { Clock, Pencil, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { appointmentsStore } from "@/lib/storage";
import { AppointmentForm } from "./AppointmentForm";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

export function AppointmentCard({ appt, showDate = false }: { appt: Appointment; showDate?: boolean }) {
  const remove = () => {
    appointmentsStore.remove(appt.id);
    toast.success("Removido");
  };
  return (
    <article className="group rounded-2xl bg-card border border-border/60 p-4 shadow-soft hover:shadow-elegant transition-smooth animate-scale-in">
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
    </article>
  );
}
