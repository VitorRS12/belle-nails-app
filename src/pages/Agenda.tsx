import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { AppointmentCard } from "@/components/AppointmentCard";
import { AppointmentForm } from "@/components/AppointmentForm";
import { EmptyState } from "@/components/EmptyState";
import { useAppointments } from "@/hooks/useStore";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays } from "lucide-react";

const Agenda = () => {
  const appts = useAppointments();
  const [selected, setSelected] = useState<Date>(new Date());

  const scheduled = useMemo(
    () => appts.filter((a) => a.status === "scheduled"),
    [appts]
  );

  const datesWithAppts = useMemo(
    () => scheduled.map((a) => parseISO(a.date)),
    [scheduled]
  );

  const dayAppts = useMemo(
    () =>
      scheduled
        .filter((a) => isSameDay(parseISO(a.date), selected))
        .sort((a, b) => a.time.localeCompare(b.time)),
    [scheduled, selected]
  );

  return (
    <AppLayout subtitle="Agendamentos" title="Agenda" action={<AppointmentForm />}>
      <div className="rounded-2xl bg-card border border-border/60 p-2 sm:p-4 shadow-soft flex justify-center">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => d && setSelected(d)}
          locale={ptBR}
          modifiers={{ booked: datesWithAppts }}
          modifiersClassNames={{
            booked:
              "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary",
          }}
          classNames={{
            day_today: "ring-1 ring-primary/40 text-foreground bg-transparent",
          }}
          className="rounded-md"
        />
      </div>

      <section className="space-y-2">
        <h2 className="font-display text-lg text-foreground/80 capitalize">
          {format(selected, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </h2>
        {dayAppts.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-5 w-5" />}
            title="Dia livre"
            description="Nenhum agendamento para esta data. Toque em + para criar."
          />
        ) : (
          <div className="space-y-3">
            {dayAppts.map((a) => (
              <AppointmentCard key={a.id} appt={a} showStatusActions />
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
};

export default Agenda;
