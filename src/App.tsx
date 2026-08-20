import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./components/PageTransition";
import { Capacitor } from "@capacitor/core";
import { Suspense, lazy } from "react";

const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// Entry routes stay eager (LCP-critical); everything else is code-split.
import Landing from "./pages/Landing.tsx";

const Index = lazy(() => import("./pages/Index.tsx"));
const Agenda = lazy(() => import("./pages/Agenda.tsx"));
const Clientes = lazy(() => import("./pages/Clientes.tsx"));
const Atendimentos = lazy(() => import("./pages/Atendimentos.tsx"));
const Configuracoes = lazy(() => import("./pages/Configuracoes.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Equipe = lazy(() => import("./pages/Equipe.tsx"));
const Servicos = lazy(() => import("./pages/Servicos.tsx"));
const PublicBooking = lazy(() => import("./pages/PublicBooking.tsx"));
const HistoricoNotificacoes = lazy(() => import("./pages/HistoricoNotificacoes.tsx"));
const MinhaJornada = lazy(() => import("./pages/MinhaJornada.tsx"));
const AdminDashboard = lazy(() => import("./features/admin/pages/AdminDashboard.tsx"));
const AdminCompanies = lazy(() => import("./features/admin/pages/AdminCompanies.tsx"));
const AdminPlans = lazy(() => import("./features/admin/pages/AdminPlans.tsx"));
const Planos = lazy(() => import("./features/billing/pages/Planos.tsx"));
const BillingSuccess = lazy(() => import("./features/billing/pages/Sucesso.tsx"));
const BillingCanceled = lazy(() => import("./features/billing/pages/Cancelado.tsx"));
const Precos = lazy(() => import("./pages/Precos.tsx"));
const Termos = lazy(() => import("./pages/legal/Termos.tsx"));
const Privacidade = lazy(() => import("./pages/legal/Privacidade.tsx"));
const Reembolso = lazy(() => import("./pages/legal/Reembolso.tsx"));
const CancelarAgendamento = lazy(() => import("./pages/CancelarAgendamento.tsx"));
const NomesParaSalaoDeBeleza = lazy(() => import("./pages/blog/NomesParaSalaoDeBeleza.tsx"));

import { SuperAdminRoute } from "./features/admin/components/SuperAdminRoute.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import { ActiveAreaProvider } from "./contexts/ActiveAreaContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient();

function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-background">
      <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );
}


function AppInner() {
  const location = useLocation();
  const wrap = (el: JSX.Element) => (
    <PageTransition>
      <Suspense fallback={<RouteFallback />}>{el}</Suspense>
    </PageTransition>
  );
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={wrap(<Landing />)} />
        <Route path="/auth" element={wrap(<Auth />)} />
        <Route path="/b/:slug" element={wrap(<PublicBooking />)} />
        <Route path="/precos" element={wrap(<Precos />)} />
        <Route path="/blog/nomes-para-salao-de-beleza" element={wrap(<NomesParaSalaoDeBeleza />)} />
        <Route path="/termos" element={wrap(<Termos />)} />
        <Route path="/privacidade" element={wrap(<Privacidade />)} />
        <Route path="/reembolso" element={wrap(<Reembolso />)} />
        <Route path="/cancelar-agendamento" element={wrap(<CancelarAgendamento />)} />
        <Route path="/inicio" element={<ProtectedRoute>{wrap(<Index />)}</ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute>{wrap(<Dashboard />)}</ProtectedRoute>} />
        <Route path="/agenda" element={<ProtectedRoute>{wrap(<Agenda />)}</ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute>{wrap(<Clientes />)}</ProtectedRoute>} />
        <Route path="/atendimentos" element={<ProtectedRoute>{wrap(<Atendimentos />)}</ProtectedRoute>} />
        <Route path="/relatorio" element={<ProtectedRoute>{wrap(<Dashboard initialTab="relatorio" />)}</ProtectedRoute>} />
        <Route path="/equipe" element={<ProtectedRoute>{wrap(<Equipe />)}</ProtectedRoute>} />
        <Route path="/servicos" element={<ProtectedRoute>{wrap(<Servicos />)}</ProtectedRoute>} />
        <Route path="/configuracoes" element={<ProtectedRoute>{wrap(<Configuracoes />)}</ProtectedRoute>} />
        <Route path="/notificacoes" element={<ProtectedRoute>{wrap(<HistoricoNotificacoes />)}</ProtectedRoute>} />
        <Route path="/minha-jornada" element={<ProtectedRoute>{wrap(<MinhaJornada />)}</ProtectedRoute>} />
        <Route path="/planos" element={<ProtectedRoute>{wrap(<Planos />)}</ProtectedRoute>} />
        <Route path="/billing/sucesso" element={<ProtectedRoute>{wrap(<BillingSuccess />)}</ProtectedRoute>} />
        <Route path="/billing/cancelado" element={<ProtectedRoute>{wrap(<BillingCanceled />)}</ProtectedRoute>} />
        <Route path="/admin" element={<SuperAdminRoute>{wrap(<AdminDashboard />)}</SuperAdminRoute>} />
        <Route path="/admin/empresas" element={<SuperAdminRoute>{wrap(<AdminCompanies />)}</SuperAdminRoute>} />
        <Route path="/admin/planos" element={<SuperAdminRoute>{wrap(<AdminPlans />)}</SuperAdminRoute>} />
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
