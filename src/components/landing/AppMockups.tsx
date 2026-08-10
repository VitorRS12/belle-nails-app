import { CalendarDays, Users, Sparkles, TrendingUp, Clock, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Live UI mockups of the internal app used on the landing page.
 * They render with the app's design tokens (so they follow light/dark
 * and the active area theme) and with i18n strings (PT/EN).
 */

function Chrome({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="w-full bg-background">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/60 bg-card/70">
        <span className="h-2 w-2 rounded-full bg-destructive/60" />
        <span className="h-2 w-2 rounded-full bg-accent/70" />
        <span className="h-2 w-2 rounded-full bg-primary/50" />
        <span className="ml-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground truncate">
          {title}
        </span>
      </div>
      <div className="p-3.5 space-y-3">{children}</div>
    </div>
  );
}

function useMoney() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith("en");
  return (v: number) =>
    new Intl.NumberFormat(isEn ? "en-US" : "pt-BR", {
      style: "currency",
      currency: isEn ? "USD" : "BRL",
      maximumFractionDigits: 0,
    }).format(v);
}

export function PanelMockup() {
  const { t } = useTranslation("landing");
  const money = useMoney();
  const stats = [
    { label: t("mockups.panel.today"), value: "6", Icon: CalendarDays },
    { label: t("mockups.panel.revenue"), value: money(980), Icon: TrendingUp },
    { label: t("mockups.panel.clients"), value: "128", Icon: Users },
    { label: t("mockups.panel.services"), value: "14", Icon: Sparkles },
  ];
  return (
    <Chrome title={t("screenshots.panel")}>
      <div className="grid grid-cols-2 gap-2.5">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className="rounded-xl border border-border/60 bg-card p-3">
            <Icon className="h-3.5 w-3.5 text-primary mb-2" />
            <p className="font-display text-lg leading-none text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">{label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border/60 bg-card p-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2.5">
          {t("mockups.panel.week")}
        </p>
        <div className="flex items-end gap-1.5 h-16">
          {[45, 70, 35, 90, 60, 100, 25].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-md bg-gradient-primary opacity-90"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </Chrome>
  );
}

export function AgendaMockup() {
  const { t } = useTranslation("landing");
  const money = useMoney();
  const rows = [
    { time: "09:00", name: "Ana Beatriz", service: t("mockups.agenda.service1"), price: 90, done: true },
    { time: "10:30", name: "Marina Alves", service: t("mockups.agenda.service2"), price: 120, done: true },
    { time: "13:00", name: "Julia Costa", service: t("mockups.agenda.service3"), price: 70, done: false },
    { time: "15:30", name: "Renata Lima", service: t("mockups.agenda.service1"), price: 90, done: false },
  ];
  return (
    <Chrome title={t("screenshots.agenda")}>
      <div className="flex items-center justify-between">
        <p className="font-display text-base text-foreground">{t("mockups.agenda.today")}</p>
        <span className="text-[10px] rounded-full bg-accent-soft text-accent-foreground px-2 py-0.5">
          {t("mockups.agenda.count", { count: rows.length })}
        </span>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.time}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-2.5"
          >
            <div className="flex flex-col items-center justify-center rounded-lg bg-secondary px-2 py-1 min-w-[46px]">
              <Clock className="h-3 w-3 text-muted-foreground mb-0.5" />
              <span className="text-[10px] font-semibold text-secondary-foreground">{r.time}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">{r.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{r.service}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold text-foreground">{money(r.price)}</p>
              <span
                className={`text-[9px] ${r.done ? "text-primary" : "text-muted-foreground"}`}
              >
                {r.done ? t("mockups.agenda.done") : t("mockups.agenda.scheduled")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Chrome>
  );
}

export function ClientsMockup() {
  const { t } = useTranslation("landing");
  const money = useMoney();
  const clients = [
    { name: "Ana Beatriz", visits: 12, total: 1080 },
    { name: "Marina Alves", visits: 8, total: 960 },
    { name: "Julia Costa", visits: 5, total: 350 },
    { name: "Renata Lima", visits: 3, total: 270 },
  ];
  return (
    <Chrome title={t("screenshots.clients")}>
      <div className="rounded-xl border border-border/60 bg-card px-3 py-2 text-[10px] text-muted-foreground">
        {t("mockups.clients.search")}
      </div>
      <div className="space-y-2">
        {clients.map((c) => (
          <div
            key={c.name}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-2.5"
          >
            <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-primary flex items-center justify-center">
              <span className="text-[11px] font-semibold text-primary-foreground">
                {c.name.charAt(0)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">{c.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {t("mockups.clients.visits", { count: c.visits })}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
              <Check className="h-3 w-3 text-primary" />
              {money(c.total)}
            </div>
          </div>
        ))}
      </div>
    </Chrome>
  );
}
