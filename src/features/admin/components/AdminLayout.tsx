import { ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Building2, CreditCard, LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, end: true },
  { to: "/admin/empresas", label: "Empresas", icon: Building2 },
  { to: "/admin/planos", label: "Planos", icon: CreditCard },
];

export function AdminLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border/60 bg-card/40 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              to="/inicio"
              className="h-8 w-8 rounded-full bg-secondary inline-flex items-center justify-center hover:bg-accent-soft transition-smooth"
              aria-label="Voltar ao app"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">
                Super Admin
              </p>
              <p className="font-display text-base leading-tight truncate">{title}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-smooth"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>

        {/* Tabs */}
        <nav className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-lg border-b-2 transition-smooth whitespace-nowrap",
                  active
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" /> {item.label}
              </NavLink>
            );
          })}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {subtitle && <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>}
        {children}
      </main>
    </div>
  );
}
