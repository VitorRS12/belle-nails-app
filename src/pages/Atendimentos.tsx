import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/AppLayout";
import { AppointmentCard } from "@/components/AppointmentCard";
import { AppointmentForm } from "@/components/AppointmentForm";
import { EmptyState } from "@/components/EmptyState";
import { useAppointments } from "@/hooks/useStore";
import { Input } from "@/components/ui/input";
import { Search, Sparkles } from "lucide-react";

const Atendimentos = () => {
  const { t } = useTranslation("app");
  const appts = useAppointments();
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    return [...appts]
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
      .filter((a) =>
        !q.trim()
          ? true
          : (a.clientName + " " + a.service).toLowerCase().includes(q.toLowerCase())
      );
  }, [appts, q]);

  const total = list.reduce((s, a) => (a.status === "completed" ? s + a.price : s), 0);

  return (
    <AppLayout subtitle={t("appointments.subtitle")} title={t("appointments.title")} action={<AppointmentForm />}>
      <div className="rounded-2xl bg-gradient-soft p-4 shadow-soft">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("appointments.totalBilled")}</p>
        <p className="font-display text-2xl text-primary">
          R$ {total.toFixed(2).replace(".", ",")}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 rounded-full"
          placeholder={t("appointments.searchPlaceholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-5 w-5" />}
          title={t("appointments.empty.title")}
          description={t("appointments.empty.description")}
        />
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <AppointmentCard key={a.id} appt={a} showDate />
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Atendimentos;
