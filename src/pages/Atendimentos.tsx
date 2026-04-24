import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { AppointmentCard } from "@/components/AppointmentCard";
import { AppointmentForm } from "@/components/AppointmentForm";
import { useAppointments } from "@/hooks/useStore";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const Atendimentos = () => {
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
    <AppLayout subtitle="Histórico" title="Atendimentos" action={<AppointmentForm />}>
      <div className="rounded-2xl bg-gradient-soft p-4 shadow-soft">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Total faturado</p>
        <p className="font-display text-2xl text-primary">
          R$ {total.toFixed(2).replace(".", ",")}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 rounded-full"
          placeholder="Buscar por cliente ou serviço"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl bg-card/60 border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum atendimento ainda.
        </div>
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
