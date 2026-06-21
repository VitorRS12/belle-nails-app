import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CompanySettingsCard } from "@/components/CompanySettingsCard";
import { hasLegacyData, migrateLegacyData } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/contexts/ThemeContext";
import { AREAS, type AreaKey } from "@/lib/types";
import { toast } from "sonner";
import { LogOut, User, UploadCloud, Briefcase, Moon, Sun, UsersRound, ChevronRight, Tag, Bell, CalendarDays, CreditCard, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useCompany } from "@/hooks/useCompany";
import { useCompanyPlan } from "@/features/billing/hooks/useCompanyPlan";
import { useIsSuperAdmin } from "@/hooks/useUserRoles";
import { Progress } from "@/components/ui/progress";

const Configuracoes = () => {
  const { user, signOut } = useAuth();
  const { profile, updateAreas } = useProfile();
  const { theme, toggleTheme } = useTheme();
  const { company } = useCompany();
  const { data: planData } = useCompanyPlan(company?.id);
  const { isSuperAdmin } = useIsSuperAdmin();
  const [loading, setLoading] = useState(false);
  const [hasLegacy, setHasLegacy] = useState(false);

  const toggleArea = async (key: AreaKey) => {
    const current = profile?.areas ?? ["manicure"];
    const next = current.includes(key)
      ? current.filter((a) => a !== key)
      : [...current, key];
    const ok = await updateAreas(next);
    if (ok) toast.success("Áreas atualizadas");
    else toast.error("Falha ao atualizar áreas");
  };

  useEffect(() => {
    setHasLegacy(hasLegacyData());
  }, []);

  const handleMigrate = async () => {
    if (!confirm("Importar os dados salvos no celular para a nuvem?")) return;
    setLoading(true);
    try {
      const r = await migrateLegacyData();
      toast.success(`Importado: ${r.clients} clientes e ${r.appointments} atendimentos!`);
      setHasLegacy(false);
    } catch (e) {
      console.error("Erro ao importar dados legados:", e);
      toast.error("Não foi possível importar os dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout subtitle="Conta" title="Configurações">
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
            <LogOut className="h-4 w-4 mr-2" /> Sair
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
                    Plano atual
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
                <Link to="/planos">Ver planos</Link>
              </Button>
            </div>

            <UsageRow
              label="Profissionais"
              used={planData.usage.professionals}
              max={planData.plan.max_professionals}
            />
            <UsageRow
              label="Agendamentos no mês"
              used={planData.usage.appointmentsThisMonth}
              max={planData.plan.max_appointments_per_month}
            />
            <UsageRow
              label="Serviços ativos"
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
              <h3 className="font-display text-lg">Painel Super Admin</h3>
              <p className="text-xs text-muted-foreground">
                Gerenciar empresas, planos e métricas da plataforma.
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
            <h3 className="font-display text-lg">Equipe</h3>
            <p className="text-xs text-muted-foreground">
              Gerencie as profissionais da sua empresa.
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
            <h3 className="font-display text-lg">Serviços</h3>
            <p className="text-xs text-muted-foreground">
              Catálogo com duração, preço e cor — usado nos agendamentos e no site público.
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
            <h3 className="font-display text-lg">Histórico de notificações</h3>
            <p className="text-xs text-muted-foreground">
              Veja todos os e-mails enviados aos clientes e à empresa.
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
            <h3 className="font-display text-lg">Minha jornada</h3>
            <p className="text-xs text-muted-foreground">
              Escolha os dias e horários em que você atende.
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
                <h3 className="font-display text-lg">Aparência</h3>
                <p className="text-xs text-muted-foreground">
                  {theme === "dark"
                    ? "Tema escuro ativado — ideal à noite."
                    : "Tema claro ativado — luminoso e suave."}{" "}
                  Sua preferência fica salva.
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Areas / Multi-perfil */}
        <div className="rounded-2xl bg-card border border-border/60 p-5 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            <Briefcase className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-display text-lg">Áreas de atuação</h3>
              <p className="text-xs text-muted-foreground">
                Escolha as áreas em que você trabalha. Os catálogos de serviços aparecerão de acordo.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {AREAS.map((a) => {
              const active = (profile?.areas ?? ["manicure"]).includes(a.key);
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => toggleArea(a.key)}
                  className={`rounded-xl border px-3 py-3 text-left transition-smooth ${
                    active
                      ? "bg-gradient-primary text-primary-foreground border-transparent shadow-soft"
                      : "bg-background border-border hover:bg-accent-soft/40"
                  }`}
                >
                  <div className="text-xl">{a.emoji}</div>
                  <div className="text-sm font-medium">{a.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Migration */}
        {hasLegacy && (
          <div className="rounded-2xl bg-gradient-soft border border-accent/40 p-5 shadow-soft">
            <div className="flex items-center gap-3 mb-3">
              <UploadCloud className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-display text-lg">Dados do celular detectados</h3>
                <p className="text-xs text-muted-foreground">Importe seus dados antigos para a nuvem para acessá-los em qualquer lugar.</p>
              </div>
            </div>
            <Button onClick={handleMigrate} disabled={loading} className="w-full bg-gradient-primary shadow-elegant rounded-xl">
              <UploadCloud className="h-4 w-4 mr-2" /> Importar dados do celular
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center px-4">
          Seus dados são salvos automaticamente na nuvem e ficam disponíveis no celular e no navegador.
        </p>
      </div>
    </AppLayout>
  );
};

export default Configuracoes;
