import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Agenda from "./pages/Agenda.tsx";
import Clientes from "./pages/Clientes.tsx";
import Atendimentos from "./pages/Atendimentos.tsx";
import Configuracoes from "./pages/Configuracoes.tsx";
import NotFound from "./pages/NotFound.tsx";
import OAuthCallback from "./pages/OAuthCallback.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import { ActiveAreaProvider } from "./contexts/ActiveAreaContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
      <Route path="/auth" element={<Auth />} />
      <Route path="/oauth-callback" element={<OAuthCallback />} />
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
      <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
      <Route path="/atendimentos" element={<ProtectedRoute><Atendimentos /></ProtectedRoute>} />
      <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
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
        <AuthProvider>
          <ActiveAreaProvider>
            <AppInner />
          </ActiveAreaProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
