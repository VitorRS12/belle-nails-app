import { AdminLayout } from "@/features/admin/components/AdminLayout";
import { useAdminMetrics } from "@/features/admin/hooks/useAdminMetrics";
import { Building2, CreditCard, CalendarCheck, TrendingUp, Sparkles, Hourglass } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const AdminDashboard = () => {
  const { t } = useTranslation("admin");
  const { data, isLoading } = useAdminMetrics();

  const cards = [
    {
      label: t("dashboard.cards.companies"),
      value: data?.totalCompanies ?? 0,
      icon: Building2,
      hint: t("dashboard.cards.companiesHint", { count: data?.newCompanies30d ?? 0 }),
    },
    {
      label: t("dashboard.cards.activeSubscriptions"),
      value: data?.activeSubscriptions ?? 0,
      icon: CreditCard,
      hint: t("dashboard.cards.activeSubscriptionsHint", { count: data?.trialingSubscriptions ?? 0 }),
    },
    {
      label: t("dashboard.cards.mrr"),
      value: formatBRL(data?.mrrCents ?? 0),
      icon: TrendingUp,
      hint: t("dashboard.cards.mrrHint"),
    },
    {
      label: t("dashboard.cards.appointmentsThisMonth"),
      value: data?.appointmentsThisMonth ?? 0,
      icon: CalendarCheck,
      hint: t("dashboard.cards.appointmentsThisMonthHint"),
    },
  ];

  return (
    <AdminLayout title={t("dashboard.title")} subtitle={t("dashboard.subtitle")}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-2xl bg-card border border-border/60 p-4 shadow-soft"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Icon className="h-4 w-4 text-primary" />
                {c.label}
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <p className="font-display text-2xl">{c.value}</p>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">{c.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl bg-gradient-soft border border-accent/40 p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg">{t("dashboard.welcome.title")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.welcome.description")}
            </p>
          </div>
        </div>
      </div>

      {data?.trialingSubscriptions ? (
        <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm flex items-center gap-3">
          <Hourglass className="h-4 w-4 text-amber-600" />
          {t("dashboard.trialingNotice", { count: data.trialingSubscriptions })}
        </div>
      ) : null}
    </AdminLayout>
  );
};

export default AdminDashboard;
