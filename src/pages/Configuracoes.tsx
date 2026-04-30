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
import { toast } from "sonner";
import { Cloud, CloudOff, Download, Upload, CheckCircle2 } from "lucide-react";

const CLIENTS_KEY = "manicure_clients_v1";
const APPTS_KEY = "manicure_appointments_v1";

const Configuracoes = () => {
  const [connected, setConnected] = useState(isConnected());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (handleOAuthRedirect()) {
      setConnected(true);
      toast.success("Google Drive conectado!");
    }
  }, []);

  const handleConnect = () => startOAuthFlow();

  const handleDisconnect = () => {
    disconnect();
    setConnected(false);
    toast.success("Google Drive desconectado");
  };

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
    else toast.error("Erro ao salvar backup. Reconecte o Google Drive.");
  };

  const handleRestore = async () => {
    if (!confirm("Isso substituirá todos os dados atuais. Continuar?")) return;
    setLoading(true);
    const raw = await downloadBackup();
    setLoading(false);
    if (!raw) {
      toast.error("Nenhum backup encontrado no Google Drive.");
      return;
    }
    try {
      const data = JSON.parse(raw);
      if (data.clients) localStorage.setItem(CLIENTS_KEY, JSON.stringify(data.clients));
      if (data.appointments) localStorage.setItem(APPTS_KEY, JSON.stringify(data.appointments));
      window.dispatchEvent(new Event("manicure:update"));
      toast.success("Dados restaurados com sucesso!");
    } catch {
      toast.error("Arquivo de backup inválido.");
    }
  };

  return (
    <AppLayout subtitle="Backup" title="Configurações">
      <div className="space-y-4">
        {/* Status */}
        <div className="rounded-2xl bg-card border border-border/60 p-5 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            {connected ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <CloudOff className="h-6 w-6 text-muted-foreground" />
            )}
            <div>
              <h3 className="font-display text-lg">Google Drive</h3>
              <p className="text-sm text-muted-foreground">
                {connected
                  ? "Conectado · backup automático ativo"
                  : "Desconectado"}
              </p>
            </div>
          </div>

          {connected ? (
            <Button
              variant="outline"
              onClick={handleDisconnect}
              className="w-full rounded-xl"
            >
              <CloudOff className="h-4 w-4 mr-2" /> Desconectar
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              className="w-full bg-gradient-primary rounded-xl shadow-elegant"
            >
              <Cloud className="h-4 w-4 mr-2" /> Conectar Google Drive
            </Button>
          )}
        </div>

        {/* Actions */}
        {connected && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleManualBackup}
              disabled={loading}
              className="rounded-xl h-auto py-4 flex flex-col gap-2"
            >
              <Upload className="h-5 w-5" />
              <span className="text-xs">Fazer backup agora</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleRestore}
              disabled={loading}
              className="rounded-xl h-auto py-4 flex flex-col gap-2"
            >
              <Download className="h-5 w-5" />
              <span className="text-xs">Restaurar backup</span>
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center px-4">
          O backup salva clientes e agendamentos no arquivo{" "}
          <strong>belle-nails-backup.json</strong> no seu Google Drive.
          {connected && " A cada alteração, o backup é atualizado automaticamente."}
        </p>
      </div>
    </AppLayout>
  );
};

export default Configuracoes;
