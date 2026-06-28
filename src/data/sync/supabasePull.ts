/**
 * Minimal Supabase pull: hydrates IndexedDB with the authenticated user's
 * company-scoped appointments and clients. Runs at sign-in/hydration so the
 * UI (which reads from Dexie) reflects rows created by the public booking
 * flow, other devices, or other team members.
 *
 * This is a one-way pull. Local writes still go through the outbox and remain
 * pending until a full SyncAdapter pushes them back to Supabase.
 */
import { supabase } from "@/integrations/supabase/client";
import { appointmentsRepo, clientsRepo } from "@/data";
import type { AppointmentRecord, ClientRecord } from "@/data/types";

function nowIso() {
  return new Date().toISOString();
}

export async function pullFromSupabase(userId: string): Promise<{ clients: number; appointments: number } | null> {
  // Resolve the user's company (owner or member).
  const { data: membership } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const companyId = membership?.company_id;
  if (!companyId) return null;

  const [{ data: clientsRows, error: cErr }, { data: apptRows, error: aErr }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, phone, notes, created_at, updated_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: true }),
    supabase
      .from("appointments")
      .select(
        "id, client_id, client_name, date, time, service, services, materials, price, notes, status, completed_at, extra_value, extra_reason, professional_id, created_at, updated_at",
      )
      .eq("company_id", companyId)
      .order("date", { ascending: false }),
  ]);

  if (cErr) console.error("pull clients failed", cErr);
  if (aErr) console.error("pull appointments failed", aErr);

  const ts = nowIso();

  const clientRecords: ClientRecord[] = (clientsRows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.created_at ?? ts,
    updatedAt: r.updated_at ?? ts,
    version: 1,
    syncStatus: "synced",
    deletedAt: null,
    remoteId: r.id,
  }));

  const apptRecords: AppointmentRecord[] = (apptRows ?? []).map((r) => ({
    id: r.id,
    clientId: r.client_id ?? "",
    clientName: r.client_name,
    date: r.date,
    time: typeof r.time === "string" ? r.time.slice(0, 5) : r.time,
    service: r.service,
    services: (r.services as unknown as AppointmentRecord["services"]) ?? [],
    materials: (r.materials as unknown as AppointmentRecord["materials"]) ?? [],
    price: Number(r.price) || 0,
    notes: r.notes ?? undefined,
    status: (r.status as AppointmentRecord["status"]) ?? "scheduled",
    completedAt: r.completed_at ?? undefined,
    extraValue: r.extra_value != null ? Number(r.extra_value) : undefined,
    extraReason: r.extra_reason ?? undefined,
    professionalId: r.professional_id ?? undefined,
    createdAt: r.created_at ?? ts,
    updatedAt: r.updated_at ?? ts,
    version: 1,
    syncStatus: "synced",
    deletedAt: null,
    remoteId: r.id,
  }));

  if (clientRecords.length) await clientsRepo.upsertMany(clientRecords, true);
  if (apptRecords.length) await appointmentsRepo.upsertMany(apptRecords, true);

  return { clients: clientRecords.length, appointments: apptRecords.length };
}
