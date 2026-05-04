import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Agenda from "./pages/Agenda.tsx";
import Clientes from "./pages/Clientes.tsx";
import Atendimentos from "./pages/Atendimentos.tsx";
import Relatorio from "./pages/Relatorio.tsx";
import Configuracoes from "./pages/Configuracoes.tsx";
import NotFound from "./pages/NotFound.tsx";
import OAuthCallback from "./pages/OAuthCallback.tsx";
import { useGoogleDriveAutoBackup } from "./hooks/useGoogleDriveBackup";
import { useEffect } from "react";
import { handleOAuthRedirect, initNativeOAuthListener } from "./lib/googleDrive";
import { toast } from "sonner";

const queryClient = new QueryClient();

function AppInner() {
  useGoogleDriveAutoBackup();

  useEffect(() => {
    handleOAuthRedirect();
    initNativeOAuthListener(() => {
      toast.success("Google Drive conectado!");
    });
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/agenda" element={<Agenda />} />
      <Route path="/clientes" element={<Clientes />} />
      <Route path="/atendimentos" element={<Atendimentos />} />
      <Route path="/relatorio" element={<Relatorio />} />
      <Route path="/configuracoes" element={<Configuracoes />} />
      <Route path="/oauth-callback" element={<OAuthCallback />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
