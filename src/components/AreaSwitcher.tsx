import { AREAS, type AreaKey } from "@/lib/types";
import { useActiveArea } from "@/contexts/ActiveAreaContext";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "pill" | "compact";
  className?: string;
}

export function AreaSwitcher({ variant = "pill", className }: Props) {
  const { area, setArea, availableAreas } = useActiveArea();
  if (availableAreas.length <= 1) return null;

  const items = AREAS.filter((a) => availableAreas.includes(a.key));

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/70 backdrop-blur p-1 shadow-soft",
        className
      )}
      role="tablist"
      aria-label="Trocar área de trabalho"
    >
      {items.map((a) => {
        const active = a.key === area;
        return (
          <button
            key={a.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setArea(a.key as AreaKey)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-smooth",
              active
                ? "bg-gradient-primary text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground hover:bg-accent-soft/50"
            )}
            title={a.label}
          >
            <span className="text-sm leading-none">{a.emoji}</span>
            {variant === "pill" && <span>{a.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
