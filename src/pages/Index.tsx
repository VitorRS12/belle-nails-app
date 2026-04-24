import { useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { AppointmentCard } from "@/components/AppointmentCard";
import { AppointmentForm } from "@/components/AppointmentForm";
import { useAppointments } from "@/hooks/useStore";
import { format, parseISO, isToday, isFuture, startOfMonth, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sparkles, TrendingUp, CalendarCheck } from "lucide-react";

const Dashboard = () => {
  const appts = useAppointments();

  const { todayScheduled, upcoming, monthRevenue, monthCount } = useMemo(() => {
    const sorted = [...appts].sort((a, b) =>
      (a.date + a.time).localeCompare(b.date + b.time)
    );
    const todayScheduled = sorted.filter(
      (a) => isToday(parseISO(a.date)) && a.status === "scheduled"
    );
    const upcoming = sorted
      .filter((a) => {
        const d = parseISO(a.date);
        return isFuture(d) && !isToday(d) && a.status === "scheduled";
      })
      .slice(0, 4);
    const monthStart = startOfMonth(new Date());
    const thisMonth = appts.filter(
      (a) => isSameMonth(parseISO(a.date), monthStart) && a.status === "completed"
    );
    return {
      todayScheduled,
      upcoming,
      monthRevenue: thisMonth.reduce((s, a) => s + a.price, 0),
      monthCount: thisMonth.length,
    };
  }, [appts]);

  return (
    <AppLayout
      subtitle={format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
      title="Bem-vinda ✨"
      action={<AppointmentForm />}
    >
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gradient-primary text-primary-foreground p-4 shadow-elegant">
          <TrendingUp className="h-5 w-5 mb-3 opacity-90" />
          <p className="text-xs uppercase tracking-wider opacity-80">Mês atual</p>
          <p className="font-display text-2xl mt-1">R$ {monthRevenue.toFixed(2).replace(".", ",")}</p>
        </div>
        <div className="rounded-2xl bg-gradient-gold text-accent-foreground p-4 shadow-gold">
          <CalendarCheck className="h-5 w-5 mb-3 opacity-90" />
          <p className="text-xs uppercase tracking-wider opacity-80">Concluídos no mês</p>
          <p className="font-display text-2xl mt-1">{monthCount}</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" /> Agendados para hoje
        </h2>
        {todayScheduled.length === 0 ? (
          <div className="rounded-2xl bg-card/60 border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum agendamento para hoje.
          </div>
        ) : (
          todayScheduled.map((a) => <AppointmentCard key={a.id} appt={a} showStatusActions />)
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Próximos</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl bg-card/60 border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Sem agendamentos futuros.
          </div>
        ) : (
          upcoming.map((a) => <AppointmentCard key={a.id} appt={a} showDate showStatusActions />)
        )}
      </section>
    </AppLayout>
  );
};

export default Dashboard;
