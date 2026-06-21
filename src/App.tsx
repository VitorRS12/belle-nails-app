import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./components/PageTransition";
import { Capacitor } from "@capacitor/core";

const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Agenda from "./pages/Agenda.tsx";
import Clientes from "./pages/Clientes.tsx";
import Atendimentos from "./pages/Atendimentos.tsx";
import Configuracoes from "./pages/Configuracoes.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Landing from "./pages/Landing.tsx";
import Relatorio from "./pages/Relatorio.tsx";
import Equipe from "./pages/Equipe.tsx";
import Servicos from "./pages/Servicos.tsx";
import PublicBooking from "./pages/PublicBooking.tsx";
import HistoricoNotificacoes from "./pages/HistoricoNotificacoes.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import { ActiveAreaProvider } from "./contexts/ActiveAreaContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient();

function AppInner() {
  const location = useLocation();
  const wrap = (el: JSX.Element) => <PageTransition>{el}</PageTransition>;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={wrap(<Landing />)} />
        <Route path="/auth" element={wrap(<Auth />)} />
        <Route path="/b/:slug" element={wrap(<PublicBooking />)} />
        <Route path="/inicio" element={<ProtectedRoute>{wrap(<Index />)}</ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute>{wrap(<Dashboard />)}</ProtectedRoute>} />
        <Route path="/agenda" element={<ProtectedRoute>{wrap(<Agenda />)}</ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute>{wrap(<Clientes />)}</ProtectedRoute>} />
        <Route path="/atendimentos" element={<ProtectedRoute>{wrap(<Atendimentos />)}</ProtectedRoute>} />
        <Route path="/relatorio" element={<ProtectedRoute>{wrap(<Dashboard initialTab="relatorio" />)}</ProtectedRoute>} />
        <Route path="/equipe" element={<ProtectedRoute>{wrap(<Equipe />)}</ProtectedRoute>} />
        <Route path="/servicos" element={<ProtectedRoute>{wrap(<Servicos />)}</ProtectedRoute>} />
        <Route path="/configuracoes" element={<ProtectedRoute>{wrap(<Configuracoes />)}</ProtectedRoute>} />
        <Route path="*" element={wrap(<NotFound />)} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <AuthProvider>
              <ActiveAreaProvider>
                <AppInner />
              </ActiveAreaProvider>
            </AuthProvider>
          </Router>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
