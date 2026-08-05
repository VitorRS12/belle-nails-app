import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const DISMISS_KEY = "bn:install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari
    window.navigator.standalone === true
  );
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

/**
 * Non-intrusive install banner.
 * - Chrome/Android: uses native beforeinstallprompt
 * - iOS Safari: shows manual instructions (Share → Add to Home Screen)
 */
export function InstallAppPrompt() {
  const { t } = useTranslation("common");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(() =>
    typeof localStorage !== "undefined" ? !!localStorage.getItem(DISMISS_KEY) : false,
  );

  useEffect(() => {
    if (isStandalone() || dismissed) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    if (isIOS()) {
      const t = setTimeout(() => setShowIOS(true), 4000);
      return () => {
        window.removeEventListener("beforeinstallprompt", handler);
        clearTimeout(t);
      };
    }
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed]);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
    setDeferred(null);
    setShowIOS(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  }

  if (dismissed || isStandalone()) return null;

  return (
    <AnimatePresence>
      {(deferred || showIOS) && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] md:bottom-4 md:left-auto md:right-4 md:w-96 z-40"
        >
          <div className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl p-4 flex gap-3 items-start">
            <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary grid place-items-center shrink-0">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm text-foreground">
                {t("installAppPrompt.title")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {deferred
                  ? t("installAppPrompt.descriptionDeferred")
                  : (
                    <>
                      <Share className="inline h-3.5 w-3.5 mx-0.5" /> {t("installAppPrompt.descriptionIOS")}
                    </>
                  )}
              </p>
              {deferred && (
                <Button size="sm" className="mt-2 h-8" onClick={install}>
                  {t("installAppPrompt.installNow")}
                </Button>
              )}
            </div>
            <button
              aria-label={t("installAppPrompt.dismiss")}
              onClick={dismiss}
              className="text-muted-foreground hover:text-foreground p-1 -mr-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
