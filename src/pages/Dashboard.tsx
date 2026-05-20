import { useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAppointments, useClients } from "@/hooks/useStore";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  subMonths,
  isWithinInterval,
  isSameMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  TrendingUp,
  CalendarCheck,
  Users,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "hsl(345 60% 60%)",
  "hsl(38 60% 65%)",
  "hsl(345 75% 75%)",
  "hsl(38 75% 75%)",
  "hsl(20 50% 60%)",
  "hsl(280 40% 65%)",
];

const Dashboard = () => {
  const appts = useAppointments();
  const clients = useClients();

  const data = useMemo(() => {
    const now = new Date();
    const completed = appts.filter((a) => a.status === "completed");

    // Last 6 months revenue
    const months = Array.from({ length: 6 }).map((_, i) => {
      const d = subMonths(now, 5 - i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const monthAppts = completed.filter((a) => {
        const ad = parseISO(a.date);
        return isWithinInterval(ad, { start, end });
      });
      return {
        label: format(d, "MMM", { locale: ptBR }),
        revenue: monthAppts.reduce((s, a) => s + a.price, 0),
        count: monthAppts.length,
      };
    });

    // Top services (all-time)
    const serviceMap = new Map<string, number>();
    completed.forEach((a) => {
      serviceMap.set(a.service, (serviceMap.get(a.service) ?? 0) + 1);
    });
    const topServices = Array.from(serviceMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));

    const thisMonth = completed.filter((a) =>
      isSameMonth(parseISO(a.date), now)
    );
    const lastMonth = completed.filter((a) =>
      isSameMonth(parseISO(a.date), subMonths(now, 1))
    );
    const lastRev = lastMonth.reduce((s, a) => s + a.price, 0);
    const thisRev = thisMonth.reduce((s, a) => s + a.price, 0);
    const variation = lastRev > 0 ? ((thisRev - lastRev) / lastRev) * 100 : null;

    const recent = [...completed]
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
      .slice(0, 8);

    return {
      months,
      topServices,
      kpis: {
        revenue: thisRev,
        count: thisMonth.length,
        clients: clients.length,
        variation,
      },
      recent,
    };
  }, [appts, clients]);

  return (
    <AppLayout
      wide
      subtitle={format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
      title="Dashboard"
    >
      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Faturamento (mês)"
          value={`R$ ${data.kpis.revenue.toFixed(2).replace(".", ",")}`}
          accent
          hint={
            data.kpis.variation != null
              ? `${data.kpis.variation >= 0 ? "+" : ""}${data.kpis.variation.toFixed(0)}% vs mês anterior`
              : undefined
          }
        />
        <KpiCard
          icon={<CalendarCheck className="h-5 w-5" />}
          label="Atendimentos (mês)"
          value={String(data.kpis.count)}
        />
        <KpiCard
          icon={<Users className="h-5 w-5" />}
          label="Clientes cadastradas"
          value={String(data.kpis.clients)}
        />
        <KpiCard
          icon={<Sparkles className="h-5 w-5" />}
          label="Serviço top"
          value={data.topServices[0]?.name ?? "—"}
          small
        />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-2xl bg-card border border-border/60 p-4 shadow-soft">
          <h3 className="font-display text-lg mb-3">Faturamento — últimos 6 meses</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.months}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                  }}
                  formatter={(v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border/60 p-4 shadow-soft">
          <h3 className="font-display text-lg mb-3">Top serviços</h3>
          {data.topServices.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.topServices}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={80}
                  >
                    {data.topServices.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* Recent table */}
      <section className="rounded-2xl bg-card border border-border/60 p-4 shadow-soft">
        <h3 className="font-display text-lg mb-3">Últimos atendimentos concluídos</h3>
        {data.recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum atendimento concluído ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Data</th>
                  <th className="py-2 pr-3">Cliente</th>
                  <th className="py-2 pr-3">Serviço</th>
                  <th className="py-2 pr-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((a) => (
                  <tr key={a.id} className="border-b border-border/40 last:border-0">
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {format(parseISO(a.date), "dd/MM/yyyy")} {a.time}
                    </td>
                    <td className="py-2 pr-3">{a.clientName}</td>
                    <td className="py-2 pr-3">{a.service}</td>
                    <td className="py-2 pr-3 text-right font-medium">
                      R$ {a.price.toFixed(2).replace(".", ",")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppLayout>
  );
};

function KpiCard({
  icon,
  label,
  value,
  hint,
  accent,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 shadow-soft border ${
        accent
          ? "bg-gradient-primary text-primary-foreground border-transparent shadow-elegant"
          : "bg-card border-border/60"
      }`}
    >
      <div className={accent ? "opacity-90" : "text-accent"}>{icon}</div>
      <p
        className={`text-[10px] uppercase tracking-wider mt-3 ${
          accent ? "opacity-80" : "text-muted-foreground"
        }`}
      >
        {label}
      </p>
      <p
        className={`font-display mt-1 ${small ? "text-base leading-snug" : "text-2xl"}`}
      >
        {value}
      </p>
      {hint && (
        <p className={`text-[11px] mt-1 ${accent ? "opacity-80" : "text-muted-foreground"}`}>
          {hint}
        </p>
      )}
    </div>
  );
}

export default Dashboard;
