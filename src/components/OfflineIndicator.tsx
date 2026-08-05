import { CloudOff, Cloud, RefreshCw } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

/**
 * Compact status chip shown in the app header.
 * - Offline → amber chip "Offline"
 * - Online + pending → primary chip "Sincronizando 3"
 * - Online + clean → muted chip "Online"
 */
export function OfflineIndicator({ className }: { className?: string }) {
  const { t } = useTranslation("common");
  const { online } = useNetworkStatus();
  const { pending } = useSyncStatus();

  const label = !online
    ? t("offlineIndicator.offline")
    : pending > 0
      ? t("offlineIndicator.syncingPending", { count: pending })
      : t("offlineIndicator.online");

  const Icon = !online ? CloudOff : pending > 0 ? RefreshCw : Cloud;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors select-none",
        !online
          ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
          : pending > 0
            ? "bg-primary/10 text-primary border-primary/30"
            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Icon
        className={cn("h-3 w-3", pending > 0 && online && "animate-spin")}
        aria-hidden
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={label}
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 2 }}
          transition={{ duration: 0.15 }}
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
