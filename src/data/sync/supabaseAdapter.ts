/**
 * Real Supabase-backed sync adapter.
 * Processes outbox entries for `clients` and `appointments` (the two entities
 * whose panel writes must reach the cloud). Other entities remain no-op so
 * their outbox rows don't block the queue.
 *
 * The adapter is intentionally best-effort: on unknown entities or missing
 * company scope it marks the entry as synced to prevent perma-stuck rows.
 */
import { supabase } from "@/integrations/supabase/client";
import type { SyncAdapter } from "./syncEngine";
import type { OutboxEntry } from "../types";

let _companyId: string | null = null;
let _userId: string | null = null;

async function resolveScope() {
  if (_companyId && _userId) return { companyId: _companyId, userId: _userId };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { companyId: null, userId: null };
  _userId = user.id;
  const { data: mem } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  _companyId = mem?.company_id ?? null;
  return { companyId: _companyId, userId: _userId };
}

export function resetSupabaseAdapterScope() {
  _companyId = null;
  _userId = null;
}

async function pushClient(entry: OutboxEntry) {
  const { companyId, userId } = await resolveScope();
  if (!companyId || !userId) return { status: "pending" as const };
  const p = entry.payload as {
    id: string;
    name?: string;
    phone?: string | null;
    notes?: string | null;
    deletedAt?: string | null;
  };
  if (entry.operation === "delete") {
    const { error } = await supabase.from("clients").delete().eq("id", p.id).eq("company_id", companyId);
    if (error) throw error;
    return { status: "synced" as const };
  }
  const row = {
    id: p.id,
    company_id: companyId,
    user_id: userId,
    name: p.name ?? "",
    phone: p.phone ?? null,
    notes: p.notes ?? null,
  };
  const { error } = await supabase.from("clients").upsert(row, { onConflict: "id" });
  if (error) throw error;
  return { status: "synced" as const };
}

async function pushAppointment(entry: OutboxEntry) {
  const { companyId, userId } = await resolveScope();
  if (!companyId || !userId) return { status: "pending" as const };
  const p = entry.payload as Record<string, unknown> & { id: string };
  if (entry.operation === "delete") {
    const { error } = await supabase.from("appointments").delete().eq("id", p.id).eq("company_id", companyId);
    if (error) throw error;
    return { status: "synced" as const };
  }
  const time = String(p.time ?? "").slice(0, 5);
  const service = String(p.service ?? "");
  const price = Number(p.price ?? 0) || 0;
  const services =
    Array.isArray(p.services) && (p.services as unknown[]).length > 0
      ? p.services
      : [{ name: service, price }];
  const row = {
    id: p.id,
    company_id: companyId,
    user_id: userId,
    client_id: (p.clientId as string) || null,
    client_name: (p.clientName as string) ?? "",
    date: p.date as string,
    time,
    service,
    services,
    materials: Array.isArray(p.materials) ? p.materials : [],
    price,
    notes: (p.notes as string) ?? null,
    status: (p.status as string) ?? "scheduled",
    completed_at: (p.completedAt as string) ?? null,
    extra_value: p.extraValue != null ? Number(p.extraValue) : null,
    extra_reason: (p.extraReason as string) ?? null,
    professional_id: (p.professionalId as string) ?? null,
  };
  // client_id is NOT NULL — skip if missing to avoid an insert error loop.
  if (!row.client_id) return { status: "synced" as const };
  const { error } = await supabase.from("appointments").upsert(row, { onConflict: "id" });
  if (error) throw error;
  return { status: "synced" as const };
}

export const SupabaseAdapter: SyncAdapter = {
  name: "supabase",
  async push(entry) {
    switch (entry.entity) {
      case "clients":
        return pushClient(entry);
      case "appointments":
        return pushAppointment(entry);
      default:
        // Unknown entity — clear it so the queue doesn't stay red forever.
        return { status: "synced" as const };
    }
  },
};
