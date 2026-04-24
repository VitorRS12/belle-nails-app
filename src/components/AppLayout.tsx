import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function AppLayout({ title, subtitle, action, children }: Props) {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="max-w-md mx-auto pb-28 pt-[env(safe-area-inset-top)]">
        <header className="px-5 pt-6 pb-4 flex items-end justify-between gap-3">
          <div className="animate-fade-in">
            {subtitle && (
              <p className="text-xs uppercase tracking-[0.18em] text-accent font-semibold mb-1">
                {subtitle}
              </p>
            )}
            <h1 className="font-display text-3xl text-foreground leading-tight">{title}</h1>
          </div>
          {action}
        </header>
        <main className="px-5 space-y-4 animate-fade-in">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
