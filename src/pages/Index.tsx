import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/AppLayout";
import { AppointmentCard } from "@/components/AppointmentCard";
import { AppointmentForm } from "@/components/AppointmentForm";
import { useAppointments } from "@/hooks/useStore";
import { format, parseISO, isToday, isFuture, startOfMonth, isSameMonth } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Sparkles, TrendingUp, CalendarCheck } from "lucide-react";
import i18n from "@/i18n";

const Dashboard = () => {
  const { t } = useTranslation("app");
  const appts = useAppointments();
  const dateLocale = i18n.resolvedLanguage === "en" ? enUS : ptBR;

  const { todayScheduled, upcoming, monthRevenue, monthCount } = useMemo(() => {
    const sorted = [...appts].sort((a, b) =>
      (a.date + a.time).localeCompare(b.date + b.time)
    );
    const isActive = (s: string) => s === "scheduled" || s === "pendente_confirmacao";
    const todayScheduled = sorted.filter(
      (a) => isToday(parseISO(a.date)) && isActive(a.status)
    );
    const upcoming = sorted
      .filter((a) => {
        const d = parseISO(a.date);
        return isFuture(d) && !isToday(d) && isActive(a.status);
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
      subtitle={format(new Date(), "EEEE, dd 'de' MMMM", { locale: dateLocale })}
      title={t("home.title")}
      action={<AppointmentForm />}
    >
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gradient-primary text-primary-foreground p-4 shadow-elegant">
          <TrendingUp className="h-5 w-5 mb-3 opacity-90" />
          <p className="text-xs uppercase tracking-wider opacity-80">{t("home.monthLabel")}</p>
          <p className="font-display text-2xl mt-1">R$ {monthRevenue.toFixed(2).replace(".", ",")}</p>
        </div>
        <div className="rounded-2xl bg-gradient-gold text-accent-foreground p-4 shadow-gold">
          <CalendarCheck className="h-5 w-5 mb-3 opacity-90" />
          <p className="text-xs uppercase tracking-wider opacity-80">{t("home.completedMonth")}</p>
          <p className="font-display text-2xl mt-1">{monthCount}</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" /> {t("home.scheduledToday")}
        </h2>
        {todayScheduled.length === 0 ? (
          <div className="rounded-2xl bg-card/60 border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t("home.noAppointmentsToday")}
          </div>
        ) : (
          todayScheduled.map((a) => <AppointmentCard key={a.id} appt={a} showStatusActions />)
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">{t("home.upcoming")}</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl bg-card/60 border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t("home.noUpcoming")}
          </div>
        ) : (
          upcoming.map((a) => <AppointmentCard key={a.id} appt={a} showDate showStatusActions />)
        )}
      </section>
    </AppLayout>
  );
};

export default Dashboard;
