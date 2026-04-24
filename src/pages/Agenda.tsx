import { useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { AppointmentCard } from "@/components/AppointmentCard";
import { AppointmentForm } from "@/components/AppointmentForm";
import { useAppointments } from "@/hooks/useStore";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const Agenda = () => {
  const appts = useAppointments();

  const grouped = useMemo(() => {
    const future = appts
      .filter((a) => a.status === "scheduled")
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const map = new Map<string, typeof appts>();
    future.forEach((a) => {
      const arr = map.get(a.date) ?? [];
      arr.push(a);
      map.set(a.date, arr);
    });
    return Array.from(map.entries());
  }, [appts]);

  return (
    <AppLayout subtitle="Agendamentos" title="Agenda" action={<AppointmentForm />}>
      {grouped.length === 0 && (
        <div className="rounded-2xl bg-card/60 border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum agendamento marcado.
        </div>
      )}
      {grouped.map(([date, items]) => (
        <section key={date} className="space-y-2">
          <h2 className="font-display text-lg text-foreground/80 capitalize">
            {format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </h2>
          <div className="space-y-3">
            {items.map((a) => (
              <AppointmentCard key={a.id} appt={a} showStatusActions />
            ))}
          </div>
        </section>
      ))}
    </AppLayout>
  );
};

export default Agenda;
