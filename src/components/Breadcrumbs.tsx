import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const LABELS: Record<string, string> = {
  inicio: "Início",
  dashboard: "Dashboard",
  agenda: "Agenda",
  clientes: "Clientes",
  atendimentos: "Histórico",
  configuracoes: "Configurações",
  relatorio: "Relatório",
};

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  return (
    <nav
      aria-label="breadcrumb"
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
    >
      <Link
        to="/inicio"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-3 w-3" />
      </Link>
      {parts.map((part, idx) => {
        const href = "/" + parts.slice(0, idx + 1).join("/");
        const isLast = idx === parts.length - 1;
        const label = LABELS[part] ?? part;
        return (
          <span key={href} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 opacity-50" />
            {isLast ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link to={href} className="hover:text-foreground transition-colors">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
