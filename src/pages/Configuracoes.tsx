import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  isConnected,
  startOAuthFlow,
  disconnect,
  uploadBackup,
  downloadBackup,
  handleOAuthRedirect,
} from "@/lib/googleDrive";
import { hasLegacyData, migrateLegacyData } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { AREAS, type AreaKey } from "@/lib/types";
import { toast } from "sonner";
import { Cloud, CloudOff, Download, Upload, CheckCircle2, LogOut, User, UploadCloud, Briefcase } from "lucide-react";

const CLIENTS_KEY = "manicure_clients_v1";
const APPTS_KEY = "manicure_appointments_v1";

const Configuracoes = () => {
  const { user, signOut } = useAuth();
  const { profile, updateAreas } = useProfile();
  const [connected, setConnected] = useState(isConnected());
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
    if (handleOAuthRedirect()) {
      setConnected(true);
      toast.success("Google Drive conectado!");
    }
  }, []);

  const handleMigrate = async () => {
    if (!confirm("Importar os dados salvos no celular para a nuvem?")) return;
    setLoading(true);
    try {
      const r = await migrateLegacyData();
      toast.success(`Importado: ${r.clients} clientes e ${r.appointments} atendimentos!`);
      setHasLegacy(false);
    } catch (e) {
      toast.error("Erro ao importar: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => startOAuthFlow();
  const handleDisconnect = () => { disconnect(); setConnected(false); toast.success("Google Drive desconectado"); };

  const handleManualBackup = async () => {
    setLoading(true);
    const data = JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      clients: JSON.parse(localStorage.getItem(CLIENTS_KEY) || "[]"),
      appointments: JSON.parse(localStorage.getItem(APPTS_KEY) || "[]"),
    });
    const ok = await uploadBackup(data);
    setLoading(false);
    if (ok) toast.success("Backup salvo no Google Drive!");
    else toast.error("Erro ao salvar backup.");
  };

  const handleRestore = async () => {
    if (!confirm("Isso substituirá todos os dados atuais. Continuar?")) return;
    setLoading(true);
    const raw = await downloadBackup();
    setLoading(false);
    if (!raw) { toast.error("Nenhum backup encontrado."); return; }
    try {
      const data = JSON.parse(raw);
      if (data.clients) localStorage.setItem(CLIENTS_KEY, JSON.stringify(data.clients));
      if (data.appointments) localStorage.setItem(APPTS_KEY, JSON.stringify(data.appointments));
      window.dispatchEvent(new Event("manicure:update"));
      toast.success("Dados restaurados! Use 'Importar dados do celular' para enviar à nuvem.");
      setHasLegacy(true);
    } catch { toast.error("Arquivo inválido."); }
  };

  return (
    <AppLayout subtitle="Conta & Backup" title="Configurações">
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

        {/* Google Drive (legacy backup) */}
        <div className="rounded-2xl bg-card border border-border/60 p-5 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            {connected ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <CloudOff className="h-6 w-6 text-muted-foreground" />}
            <div>
              <h3 className="font-display text-lg">Google Drive (opcional)</h3>
              <p className="text-sm text-muted-foreground">
                {connected ? "Conectado · backup do localStorage" : "Backup extra dos dados locais"}
              </p>
            </div>
          </div>
          {connected ? (
            <Button variant="outline" onClick={handleDisconnect} className="w-full rounded-xl">
              <CloudOff className="h-4 w-4 mr-2" /> Desconectar
            </Button>
          ) : (
            <Button onClick={handleConnect} className="w-full bg-gradient-primary rounded-xl shadow-elegant">
              <Cloud className="h-4 w-4 mr-2" /> Conectar Google Drive
            </Button>
          )}
        </div>

        {connected && (
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleManualBackup} disabled={loading} className="rounded-xl h-auto py-4 flex flex-col gap-2">
              <Upload className="h-5 w-5" /><span className="text-xs">Backup agora</span>
            </Button>
            <Button variant="outline" onClick={handleRestore} disabled={loading} className="rounded-xl h-auto py-4 flex flex-col gap-2">
              <Download className="h-5 w-5" /><span className="text-xs">Restaurar</span>
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
