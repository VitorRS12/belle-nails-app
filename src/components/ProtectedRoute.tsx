import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles } from "lucide-react";

const GUEST_KEY = "bn:guest";

export function isGuestMode() {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(GUEST_KEY) === "1";
}

export function enableGuestMode() {
  localStorage.setItem(GUEST_KEY, "1");
}

export function disableGuestMode() {
  localStorage.removeItem(GUEST_KEY);
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Sparkles className="h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">Carregando…</p>
        </div>
      </div>
    );
  }

  // Allow access if authenticated OR in offline guest mode.
  if (!session && !isGuestMode()) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

