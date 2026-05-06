import { Browser } from "@capacitor/browser";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

const CLIENT_ID = "1015780156925-msh8403357kg6bm2j5o3bag0l32eu25c.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file";
const BACKUP_FILENAME = "belle-nails-backup.json";

// IMPORTANT: This URL must be your PUBLISHED Lovable URL and must be added
// to "Authorized redirect URIs" in Google Cloud Console.
// On native (APK), Google redirects here, and this page bounces back to the app via deep link.
const PUBLISHED_REDIRECT = "https://mani-plan-pro.lovable.app/oauth-callback";
const NATIVE_DEEP_LINK_SCHEME = "app.lovable.bellenails";

const TOKEN_KEY = "gdrive_access_token";
const EXPIRY_KEY = "gdrive_token_expiry";

export function getStoredToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(EXPIRY_KEY);
  if (!token || !expiry) return null;
  if (Date.now() > Number(expiry)) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    return null;
  }
  return token;
}

function storeToken(token: string, expiresIn: number) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EXPIRY_KEY, String(Date.now() + expiresIn * 1000));
}

export function isConnected(): boolean {
  return !!getStoredToken();
}

export function disconnect() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}

export function startOAuthFlow() {
  const isNative = Capacitor.isNativePlatform();
  // On native: use the published web page as redirect, which then deep-links back.
  // On web: use the current origin.
  const redirectUri = isNative ? PUBLISHED_REDIRECT : `${window.location.origin}/oauth-callback`;

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "token",
    scope: SCOPES,
    prompt: "consent",
    state: isNative ? "native" : "web",
  });
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  if (isNative) {
    Browser.open({ url: authUrl });
  } else {
    window.location.href = authUrl;
  }
}

/**
 * Called on the /oauth-callback page (web).
 * If the redirect carries a token, either store it (web) or bounce to deep link (native state).
 */
export function handleOAuthCallbackPage() {
  const hash = window.location.hash;
  if (!hash.includes("access_token")) return;
  const params = new URLSearchParams(hash.substring(1));
  const state = params.get("state");
  if (state === "native") {
    // Bounce to the native app via custom URL scheme
    window.location.href = `${NATIVE_DEEP_LINK_SCHEME}://oauth#${hash.substring(1)}`;
    return;
  }
  // Web flow: store and redirect to settings
  const token = params.get("access_token");
  const expiresIn = Number(params.get("expires_in") || "3600");
  if (token) {
    storeToken(token, expiresIn);
    window.location.replace("/configuracoes");
  }
}

/**
 * Legacy helper kept for backwards compatibility (called from App).
 * Handles tokens arriving in the URL hash on any page.
 */
export function handleOAuthRedirect(): boolean {
  const hash = window.location.hash;
  if (!hash.includes("access_token")) return false;
  const params = new URLSearchParams(hash.substring(1));
  const token = params.get("access_token");
  const expiresIn = Number(params.get("expires_in") || "3600");
  if (token) {
    storeToken(token, expiresIn);
    window.history.replaceState(null, "", window.location.pathname);
    return true;
  }
  return false;
}

/**
 * Listen for the deep link callback on native platforms.
 * Should be initialized once at app start.
 */
export function initNativeOAuthListener(onToken?: () => void) {
  if (!Capacitor.isNativePlatform()) return;
  CapApp.addListener("appUrlOpen", async (event) => {
    const url = event.url || "";
    if (!url.startsWith(`${NATIVE_DEEP_LINK_SCHEME}://oauth`)) return;
    const hashIndex = url.indexOf("#");
    if (hashIndex === -1) return;
    const params = new URLSearchParams(url.substring(hashIndex + 1));
    const token = params.get("access_token");
    const expiresIn = Number(params.get("expires_in") || "3600");
    if (token) {
      storeToken(token, expiresIn);
      try {
        await Browser.close();
      } catch {
        // ignore
      }
      onToken?.();
    }
  });
}

async function findBackupFile(token: string): Promise<string | null> {
  const q = encodeURIComponent(`name='${BACKUP_FILENAME}' and trashed=false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.files?.[0]?.id ?? null;
}

export async function uploadBackup(jsonData: string): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const existingId = await findBackupFile(token);
    const metadata = { name: BACKUP_FILENAME, mimeType: "application/json" };
    const boundary = "belle_nails_boundary";
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) +
      `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
      jsonData +
      `\r\n--${boundary}--`;

    const url = existingId
      ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart`
      : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

    const res = await fetch(url, {
      method: existingId ? "PATCH" : "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    if (res.status === 401) {
      disconnect();
      return false;
    }
    return res.ok;
  } catch {
    return false;
  }
}

export async function downloadBackup(): Promise<string | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const fileId = await findBackupFile(token);
    if (!fileId) return null;

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
