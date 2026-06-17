import { NavLink } from "react-router-dom";
import { Home, CalendarDays, Users, Sparkles, Settings, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Painel" },
  { to: "/inicio", icon: Home, label: "Início" },
  { to: "/agenda", icon: CalendarDays, label: "Agenda" },
  { to: "/clientes", icon: Users, label: "Clientes" },
  { to: "/atendimentos", icon: Sparkles, label: "Histórico" },
  { to: "/configuracoes", icon: Settings, label: "Config" },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-7 max-w-md mx-auto">
        {items.map(({ to, icon: Icon, label }) => (
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
                  <span className="font-medium">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
