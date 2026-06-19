import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { AppointmentCard } from "@/components/AppointmentCard";
import { AppointmentForm } from "@/components/AppointmentForm";
import { EmptyState } from "@/components/EmptyState";
import { useAppointments } from "@/hooks/useStore";
import { useProfessionals } from "@/hooks/useProfessionals";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays } from "lucide-react";

const ALL = "__all__";

const Agenda = () => {
  const appts = useAppointments();
  const { professionals } = useProfessionals();
  const activeProfessionals = useMemo(
    () => professionals.filter((p) => p.active),
    [professionals]
  );
  const [selected, setSelected] = useState<Date>(new Date());
  const [profFilter, setProfFilter] = useState<string>(ALL);

  const scheduled = useMemo(
    () =>
      appts.filter(
        (a) =>
          (a.status === "scheduled" || a.status === "pendente_confirmacao") &&
          (profFilter === ALL || a.professionalId === profFilter)
      ),
    [appts, profFilter]
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

  const profName = (id?: string) =>
    id ? professionals.find((p) => p.id === id)?.name : undefined;

  return (
    <AppLayout subtitle="Agendamentos" title="Agenda" action={<AppointmentForm />}>
      {activeProfessionals.length > 1 && (
        <div className="mb-3">
          <Select value={profFilter} onValueChange={setProfFilter}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas as profissionais</SelectItem>
              {activeProfessionals.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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
              <div key={a.id} className="space-y-1">
                {activeProfessionals.length > 1 && a.professionalId && (
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-1">
                    {profName(a.professionalId) ?? "—"}
                  </p>
                )}
                <AppointmentCard appt={a} showStatusActions />
              </div>
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
};

export default Agenda;
