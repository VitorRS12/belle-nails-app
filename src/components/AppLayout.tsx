import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AreaSwitcher } from "./AreaSwitcher";
import { Breadcrumbs } from "./Breadcrumbs";
import { OfflineIndicator } from "./OfflineIndicator";
import { InstallAppPrompt } from "./InstallAppPrompt";
import { LanguageToggle } from "./LanguageToggle";
import { TrialBanner } from "@/features/billing/components/TrialBanner";

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}

export function AppLayout({ title, subtitle, action, children, wide }: Props) {
  return (
    <SidebarProvider>
      <div className="min-h-[100dvh] flex w-full bg-gradient-hero overscroll-none">
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <TrialBanner />

          <header className="hidden md:flex h-16 items-center border-b border-border/60 bg-card/40 backdrop-blur-xl px-4">
            <SidebarTrigger />
            <div className="ml-3 flex flex-col gap-0.5">
              <Breadcrumbs />
              <h1 className="font-display text-lg text-foreground leading-tight">{title}</h1>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <OfflineIndicator />
              <LanguageToggle />
              <AreaSwitcher />

              {action}
            </div>
          </header>

          <main
            className={`flex-1 pb-[calc(env(safe-area-inset-bottom)+6rem)] md:pb-8 pt-[env(safe-area-inset-top)] mx-auto w-full ${
              wide ? "max-w-6xl" : "max-w-full sm:max-w-2xl md:max-w-5xl"
            }`}
          >
            <header className="md:hidden sticky top-0 z-20 bg-background/85 backdrop-blur-xl border-b border-border/40 px-4 sm:px-6 pt-5 pb-3 flex items-end justify-between gap-3">
              <div className="animate-fade-in min-w-0 flex-1">
                {subtitle && (
                  <p className="text-[10px] uppercase tracking-[0.18em] text-accent font-semibold mb-0.5 truncate">
                    {subtitle}
                  </p>
                )}
                <h1 className="font-display text-[24px] sm:text-[28px] text-foreground leading-tight truncate">{title}</h1>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <OfflineIndicator />
                <LanguageToggle />
                {action}

              </div>
            </header>
            <div className="md:hidden px-4 sm:px-6 pt-3 pb-1 -mx-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <AreaSwitcher variant="compact" />
            </div>
            <div className="px-4 sm:px-6 md:px-8 pt-3 md:pt-6 space-y-4 animate-fade-in">{children}</div>
          </main>
        </div>

        <div className="md:hidden">
          <BottomNav />
        </div>

        <InstallAppPrompt />
      </div>
    </SidebarProvider>
  );
}

