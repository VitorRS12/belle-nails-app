/**
 * Guarded service-worker registration.
 * Never registers in Lovable preview, iframes, dev mode, or when ?sw=off is present.
 * In those contexts it actively unregisters any matching /sw.js to keep previews fresh.
 */
import { toast } from "sonner";

const SW_URL = "/sw.js";

function isBlockedHost(hostname: string) {
  return (
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev")
  );
}

function shouldSkip(): boolean {
  if (typeof window === "undefined") return true;
  if (!("serviceWorker" in navigator)) return true;
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  if (isBlockedHost(window.location.hostname)) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterMatching() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => r.active?.scriptURL?.endsWith(SW_URL) || r.installing?.scriptURL?.endsWith(SW_URL) || r.waiting?.scriptURL?.endsWith(SW_URL))
        .map((r) => r.unregister()),
    );
  } catch {
    // ignore
  }
}

export async function registerSW(): Promise<void> {
  if (shouldSkip()) {
    await unregisterMatching();
    return;
  }
  try {
    const { registerSW: register } = await import("virtual:pwa-register");
    register({
      immediate: true,
      onNeedRefresh() {
        toast("Nova versão disponível", {
          description: "Atualize para receber as últimas melhorias.",
          action: {
            label: "Atualizar",
            onClick: () => window.location.reload(),
          },
          duration: 10000,
        });
      },
      onOfflineReady() {
        toast.success("Pronto para uso offline", {
          description: "O app já funciona sem internet neste dispositivo.",
        });
      },
    });
  } catch (err) {
    console.warn("[PWA] registration skipped", err);
  }
}
