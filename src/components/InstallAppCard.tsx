import { useEffect, useState } from "react";
import { Download, Share, Smartphone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

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

function detectPlatform(): "ios" | "android" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

/**
 * Always-visible install card for the Settings page.
 * - Android/Chrome: triggers native install prompt when available
 * - iOS Safari: shows step-by-step instructions
 * - Already installed: shows confirmation state
 */
export function InstallAppCard() {
  const { t } = useTranslation("common");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const platform = detectPlatform();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      toast.success(t("installAppCard.installedToast"));
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
      }
      setDeferred(null);
      return;
    }
    if (platform === "ios") {
      setShowIOSHelp((v) => !v);
      return;
    }
    toast.info(t("installAppCard.browserMenuHint"), { duration: 6000 });
  }

  return (
    <div className="rounded-2xl bg-card border border-border/60 p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <div
          className={`h-11 w-11 shrink-0 rounded-full inline-flex items-center justify-center ${
            installed
              ? "bg-emerald-500/15 text-emerald-600"
              : "bg-gradient-primary text-primary-foreground"
          }`}
        >
          {installed ? <Check className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg leading-tight">
            {installed ? t("installAppCard.installedTitle") : t("installAppCard.title")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {installed
              ? t("installAppCard.installedDescription")
              : t("installAppCard.description")}
          </p>

          {!installed && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={install} className="rounded-full">
                <Download className="h-4 w-4 mr-1.5" />
                {platform === "ios" ? t("installAppCard.howToInstall") : t("installAppCard.installNow")}
              </Button>
              {platform !== "ios" && !deferred && (
                <span className="text-[11px] text-muted-foreground self-center">
                  {t("installAppCard.browserFallbackHint")}
                </span>
              )}
            </div>
          )}

          {!installed && (platform === "ios" || showIOSHelp) && (
            <ol className="mt-3 space-y-1.5 text-xs text-muted-foreground list-decimal pl-4">
              <li>
                <Share className="inline h-3.5 w-3.5 mx-0.5 align-text-bottom" /> {t("installAppCard.iosSteps.step1")}
              </li>
              <li>{t("installAppCard.iosSteps.step2")}</li>
              <li>{t("installAppCard.iosSteps.step3")}</li>
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
