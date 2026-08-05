import { ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Building2, CreditCard, LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function AdminLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation("admin");
  const { signOut } = useAuth();
  const location = useLocation();

  const NAV = [
    { to: "/admin", label: t("layout.nav.overview"), icon: LayoutDashboard, end: true },
    { to: "/admin/empresas", label: t("layout.nav.companies"), icon: Building2 },
    { to: "/admin/planos", label: t("layout.nav.plans"), icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border/60 bg-card/40 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              to="/inicio"
              className="h-8 w-8 rounded-full bg-secondary inline-flex items-center justify-center hover:bg-accent-soft transition-smooth"
              aria-label={t("layout.backToApp")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">
                {t("layout.superAdmin")}
              </p>
              <p className="font-display text-base leading-tight truncate">{title}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-smooth"
          >
            <LogOut className="h-4 w-4" /> {t("layout.signOut")}
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
