import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { hasLegacyData, migrateLegacyData } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { AREAS, type AreaKey } from "@/lib/types";
import { toast } from "sonner";
import { LogOut, User, UploadCloud, Briefcase } from "lucide-react";

const Configuracoes = () => {
  const { user, signOut } = useAuth();
  const { profile, updateAreas } = useProfile();
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
