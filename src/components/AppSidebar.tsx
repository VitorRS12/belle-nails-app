import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Home,
  CalendarDays,
  Users,
  Sparkles,
  Settings,
  LayoutDashboard,
  Tag,
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
  { to: "/dashboard", icon: LayoutDashboard, key: "dashboard" },
  { to: "/inicio", icon: Home, key: "inicio" },
  { to: "/agenda", icon: CalendarDays, key: "agenda" },
  { to: "/clientes", icon: Users, key: "clientes" },
  { to: "/atendimentos", icon: Sparkles, key: "atendimentos" },
  { to: "/servicos", icon: Tag, key: "servicos" },
  { to: "/configuracoes", icon: Settings, key: "configuracoes" },
] as const;

export function AppSidebar() {
  const { t } = useTranslation("common");
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="bg-card/60 backdrop-blur-xl">
        <div className="px-4 py-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">
            {t("appSidebar.brand")}
          </p>
          {!collapsed && (
            <h2 className="font-display text-xl text-foreground mt-1">{t("appSidebar.panel")}</h2>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>{t("appSidebar.navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(({ to, icon: Icon, key }) => {
                const active = pathname === to;
                return (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink to={to} end className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {!collapsed && <span>{t(`appSidebar.nav.${key}`)}</span>}
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
