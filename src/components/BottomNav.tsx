import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, CalendarDays, Users, Sparkles, Settings, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", icon: LayoutDashboard, key: "dashboard" },
  { to: "/inicio", icon: Home, key: "inicio" },
  { to: "/agenda", icon: CalendarDays, key: "agenda" },
  { to: "/clientes", icon: Users, key: "clientes" },
  { to: "/atendimentos", icon: Sparkles, key: "atendimentos" },
  { to: "/configuracoes", icon: Settings, key: "configuracoes" },
] as const;

export function BottomNav() {
  const { t } = useTranslation("common");
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-6 max-w-md mx-auto">
        {items.map(({ to, icon: Icon, key }) => (
          <li key={to}>
            <NavLink
              to={to}
              end
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-3 text-xs transition-smooth",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex items-center justify-center h-9 w-9 rounded-full transition-smooth",
                      isActive && "bg-gradient-primary shadow-soft text-primary-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-medium">{t(`bottomNav.${key}`)}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
