import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  CalendarDays,
  Users,
  Sparkles,
  Settings,
  LayoutDashboard,
  UsersRound,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/inicio", icon: Home, label: "Início" },
  { to: "/agenda", icon: CalendarDays, label: "Agenda" },
  { to: "/clientes", icon: Users, label: "Clientes" },
  { to: "/atendimentos", icon: Sparkles, label: "Histórico" },
  { to: "/equipe", icon: UsersRound, label: "Equipe" },
  { to: "/configuracoes", icon: Settings, label: "Configurações" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="bg-card/60 backdrop-blur-xl">
        <div className="px-4 py-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">
            Belle Nails
          </p>
          {!collapsed && (
            <h2 className="font-display text-xl text-foreground mt-1">Painel</h2>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(({ to, icon: Icon, label }) => {
                const active = pathname === to;
                return (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink to={to} end className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {!collapsed && <span>{label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
