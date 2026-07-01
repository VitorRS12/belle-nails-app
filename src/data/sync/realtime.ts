/**
 * Realtime + auto-sync wiring.
 * - Subscribes to Supabase changes on `appointments` for the current company
 *   and re-pulls whenever a row is inserted or updated (with a toast on new
 *   bookings).
 * - Flushes the outbox whenever the browser regains connectivity, plus a
 *   periodic tick so retries don't need a manual trigger.
 */
import { supabase } from "@/integrations/supabase/client";
import { syncEngine } from "./syncEngine";
import { pullFromSupabase } from "./supabasePull";
import { toast } from "sonner";

type Channel = ReturnType<typeof supabase.channel>;

let channel: Channel | null = null;
let onlineHandler: (() => void) | null = null;
let interval: ReturnType<typeof setInterval> | null = null;
let currentUserId: string | null = null;

async function safeFlush() {
  try {
    await syncEngine.flush();
  } catch (e) {
    console.warn("sync flush failed:", e);
  }
}

async function safePull(userId: string, notifyNew = false) {
  try {
    const before = notifyNew ? Date.now() : 0;
    const res = await pullFromSupabase(userId);
    if (notifyNew && res && res.appointments > 0) {
      // Best-effort UI signal — the panel refreshes via useLiveQuery.
      toast.success("Novo agendamento recebido");
    }
    void before;
  } catch (e) {
    console.warn("realtime pull failed:", e);
  }
}

export async function startRealtimeSync(userId: string) {
  stopRealtimeSync();
  currentUserId = userId;

  // Auto-flush on reconnect
  onlineHandler = () => {
    void safeFlush();
    void safePull(userId);
  };
  window.addEventListener("online", onlineHandler);

  // Periodic tick (every 30s) — cheap because flush no-ops when empty/offline
  interval = setInterval(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    void safeFlush();
  }, 30_000);

  // Resolve company for the realtime filter
  const { data: mem } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const companyId = mem?.company_id;
  if (!companyId) return;

  channel = supabase
    .channel(`appts-${companyId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "appointments", filter: `company_id=eq.${companyId}` },
      () => void safePull(userId, true),
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "appointments", filter: `company_id=eq.${companyId}` },
      () => void safePull(userId, false),
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "appointments", filter: `company_id=eq.${companyId}` },
      () => void safePull(userId, false),
    )
    .subscribe();
}

export function stopRealtimeSync() {
  if (channel) {
    try {
      supabase.removeChannel(channel);
    } catch {
      /* ignore */
    }
    channel = null;
  }
  if (onlineHandler) {
    window.removeEventListener("online", onlineHandler);
    onlineHandler = null;
  }
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  currentUserId = null;
}
