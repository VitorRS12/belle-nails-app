import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CompanySettingsCard } from "@/components/CompanySettingsCard";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/contexts/ThemeContext";
import { AREAS, type AreaKey } from "@/lib/types";
import { toast } from "sonner";
import { LogOut, User, Briefcase, Moon, Sun, UsersRound, ChevronRight, Tag, Bell, CalendarDays, CreditCard, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useCompany } from "@/hooks/useCompany";
import { useCompanyPlan } from "@/features/billing/hooks/useCompanyPlan";
import { useIsSuperAdmin } from "@/hooks/useUserRoles";
import { Progress } from "@/components/ui/progress";
import { InstallAppCard } from "@/components/InstallAppCard";

const Configuracoes = () => {
  const { t } = useTranslation("app");
  const { user, signOut } = useAuth();
  const { profile, updateArea } = useProfile();
  const { theme, toggleTheme } = useTheme();
  const { company } = useCompany();
  const { data: planData } = useCompanyPlan(company?.id);
  const { isSuperAdmin } = useIsSuperAdmin();

  const handleSetArea = async (key: AreaKey) => {
    if (profile?.area === key) return;
    const ok = await updateArea(key);
    if (ok) toast.success(t("settings.areaUpdated"));
    else toast.error(t("settings.areaUpdateFailed"));
  };



  return (
    <AppLayout subtitle={t("settings.subtitle")} title={t("settings.title")}>
      <div className="space-y-4">
        {/* Account */}
        <div className="rounded-2xl bg-card border border-border/60 p-5 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-11 w-11 rounded-full bg-gradient-primary text-primary-foreground inline-flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg truncate">{user?.user_metadata?.full_name ?? user?.email}</h3>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => signOut()} className="w-full rounded-xl">
            <LogOut className="h-4 w-4 mr-2" /> {t("settings.signOut")}
          </Button>
        </div>

        {/* Empresa */}
        <CompanySettingsCard />

        {/* Plano atual + uso */}
        {planData?.plan && (
          <div className="rounded-2xl bg-card border border-border/60 p-5 shadow-soft space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-11 w-11 rounded-full bg-gradient-primary text-primary-foreground inline-flex items-center justify-center">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t("settings.plan.current")}
                  </p>
                  <h3 className="font-display text-lg truncate">
                    {planData.plan.plan_name}{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      · {planData.plan.status}
                    </span>
                  </h3>
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/planos">{t("settings.plan.viewPlans")}</Link>
              </Button>
            </div>

            <UsageRow
              label={t("settings.plan.professionals")}
              used={planData.usage.professionals}
              max={planData.plan.max_professionals}
            />
            <UsageRow
              label={t("settings.plan.appointmentsMonth")}
              used={planData.usage.appointmentsThisMonth}
              max={planData.plan.max_appointments_per_month}
            />
            <UsageRow
              label={t("settings.plan.activeServices")}
              used={planData.usage.services}
              max={planData.plan.max_services}
            />
          </div>
        )}

        {/* Super Admin */}
        {isSuperAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-3 rounded-2xl bg-gradient-soft border border-primary/30 p-5 shadow-soft transition-smooth hover:bg-accent-soft/60"
          >
            <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg">{t("settings.superAdmin.title")}</h3>
              <p className="text-xs text-muted-foreground">
                {t("settings.superAdmin.description")}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        )}


        {/* Equipe */}
        <Link
          to="/equipe"
          className="flex items-center gap-3 rounded-2xl bg-card border border-border/60 p-5 shadow-soft transition-smooth hover:bg-accent-soft/40"
        >
          <div className="h-11 w-11 rounded-full bg-gradient-primary text-primary-foreground inline-flex items-center justify-center">
            <UsersRound className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg">{t("settings.links.team.title")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("settings.links.team.description")}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>

        {/* Serviços */}
        <Link
          to="/servicos"
          className="flex items-center gap-3 rounded-2xl bg-card border border-border/60 p-5 shadow-soft transition-smooth hover:bg-accent-soft/40"
        >
          <div className="h-11 w-11 rounded-full bg-gradient-primary text-primary-foreground inline-flex items-center justify-center">
            <Tag className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg">{t("settings.links.services.title")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("settings.links.services.description")}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>

        {/* Histórico de notificações */}
        <Link
          to="/notificacoes"
          className="flex items-center gap-3 rounded-2xl bg-card border border-border/60 p-5 shadow-soft transition-smooth hover:bg-accent-soft/40"
        >
          <div className="h-11 w-11 rounded-full bg-gradient-primary text-primary-foreground inline-flex items-center justify-center">
            <Bell className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg">{t("settings.links.notifications.title")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("settings.links.notifications.description")}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>

        {/* Minha jornada */}
        <Link
          to="/minha-jornada"
          className="flex items-center gap-3 rounded-2xl bg-card border border-border/60 p-5 shadow-soft transition-smooth hover:bg-accent-soft/40"
        >
          <div className="h-11 w-11 rounded-full bg-gradient-primary text-primary-foreground inline-flex items-center justify-center">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg">{t("settings.links.myJourney.title")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("settings.links.myJourney.description")}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>





        {/* Appearance */}
        <div className="relative overflow-hidden rounded-2xl border border-border/60 p-5 shadow-soft bg-card">
          {/* Ambient accent */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-12 -right-10 h-40 w-40 rounded-full opacity-60 blur-3xl transition-opacity duration-500"
            style={{
              background:
                theme === "dark"
                  ? "radial-gradient(circle, hsl(345 70% 55% / 0.45), transparent 70%)"
                  : "radial-gradient(circle, hsl(38 80% 70% / 0.55), transparent 70%)",
            }}
          />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`h-11 w-11 rounded-full inline-flex items-center justify-center transition-colors duration-500 ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-[hsl(345_45%_25%)] to-[hsl(340_30%_18%)] text-primary"
                    : "bg-gradient-to-br from-[hsl(38_85%_82%)] to-[hsl(38_70%_70%)] text-accent-foreground"
                }`}
              >
                {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-lg">{t("settings.appearance.title")}</h3>
                <p className="text-xs text-muted-foreground">
                  {theme === "dark"
                    ? t("settings.appearance.darkOn")
                    : t("settings.appearance.lightOn")}{" "}
                  {t("settings.appearance.savedPreference")}
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Área de atuação (única) */}
        <div className="rounded-2xl bg-card border border-border/60 p-5 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            <Briefcase className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-display text-lg">{t("settings.area.title")}</h3>
              <p className="text-xs text-muted-foreground">
                {t("settings.area.description")}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t("settings.area.title")}>
            {AREAS.map((a) => {
              const active = (profile?.area ?? "manicure") === a.key;
              return (
                <button
                  key={a.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => handleSetArea(a.key)}
                  className={`rounded-xl border px-3 py-3 text-left transition-smooth ${
                    active
                      ? "bg-gradient-primary text-primary-foreground border-transparent shadow-soft"
                      : "bg-background border-border hover:bg-accent-soft/40"
                  }`}
                >
                  <div className="text-xl">{a.emoji}</div>
                  <div className="text-sm font-medium">{t(`settings.areaOptions.${a.key}`, { defaultValue: a.label })}</div>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center px-4">
          {t("settings.cloudNote")}
        </p>

        {/* Instalar app (PWA) — sempre no fim da página */}
        <InstallAppCard />

      </div>
    </AppLayout>
  );
};

function UsageRow({ label, used, max }: { label: string; used: number; max: number | null }) {
  const unlimited = max === null || max === undefined;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(max, 1)) * 100));
  const danger = !unlimited && pct >= 90;
  const warn = !unlimited && pct >= 75 && pct < 90;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`tabular-nums ${danger ? "text-destructive" : warn ? "text-amber-600" : "text-foreground"}`}>
          {used} / {unlimited ? "∞" : max}
        </span>
      </div>
      {!unlimited && (
        <Progress value={pct} className={danger ? "[&>div]:bg-destructive" : warn ? "[&>div]:bg-amber-500" : ""} />
      )}
    </div>
  );
}

export default Configuracoes;
