import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

/**
 * Premium animated theme toggle.
 * Sun ⇄ Moon with a sliding thumb and ambient glow.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex h-9 w-[4.5rem] shrink-0 items-center rounded-full",
        "border border-border/70 px-1",
        "transition-colors duration-500",
        isDark
          ? "bg-gradient-to-r from-[hsl(340_25%_14%)] to-[hsl(345_30%_22%)]"
          : "bg-gradient-to-r from-[hsl(38_70%_88%)] to-[hsl(345_50%_92%)]",
        "shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {/* Background icons (static, subtle) */}
      <Sun
        className={cn(
          "absolute left-2 h-3.5 w-3.5 transition-opacity duration-500",
          isDark ? "opacity-30 text-accent" : "opacity-0",
        )}
      />
      <Moon
        className={cn(
          "absolute right-2 h-3.5 w-3.5 transition-opacity duration-500",
          isDark ? "opacity-0" : "opacity-40 text-primary",
        )}
      />

      {/* Sliding thumb */}
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={cn(
          "relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full",
          "shadow-elegant",
          isDark
            ? "ml-auto bg-gradient-to-br from-[hsl(345_75%_70%)] to-[hsl(345_60%_55%)]"
            : "bg-gradient-to-br from-[hsl(48_95%_70%)] to-[hsl(38_85%_60%)]",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.span
              key="moon"
              initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.25 }}
              className="text-primary-foreground"
            >
              <Moon className="h-4 w-4 fill-current" />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.25 }}
              className="text-[hsl(30_60%_25%)]"
            >
              <Sun className="h-4 w-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>
    </button>
  );
}
