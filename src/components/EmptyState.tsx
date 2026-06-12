import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  icon?: ReactNode;
  title?: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-card/60 border border-dashed border-border p-8 text-center animate-fade-in",
        className,
      )}
    >
      {icon && (
        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gradient-soft flex items-center justify-center text-primary">
          {icon}
        </div>
      )}
      {title && <p className="font-display text-lg text-foreground mb-1">{title}</p>}
      <p className="text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
