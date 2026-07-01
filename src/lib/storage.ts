/**
 * Local-first storage facade.
 *
 * Public API is intentionally synchronous (memory cache + event bus) so existing
 * pages keep working unchanged. Persistence is delegated to Dexie/IndexedDB via
 * the repositories in `src/data`. The legacy Supabase calls have been removed —
 * a future SyncAdapter is the only thing needed to push these changes to a
 * backend.
 */
import { appointmentsRepo, clientsRepo, syncEngine } from "@/data";
import { pullFromSupabase } from "@/data/sync/supabasePull";
import { SupabaseAdapter, resetSupabaseAdapterScope } from "@/data/sync/supabaseAdapter";
import { startRealtimeSync, stopRealtimeSync } from "@/data/sync/realtime";
import type { AppointmentRecord, ClientRecord } from "@/data/types";
import type { Appointment, Client } from "./types";
import { toast } from "sonner";

let _clients: Client[] = [];
let _appts: Appointment[] = [];
let _userId: string | null = null;
let _hydrated = false;

function emit() {
  window.dispatchEvent(new Event("manicure:update"));
}

export function isHydrated() {
  return _hydrated;
}
export function getCurrentUserId() {
  return _userId;
}
export function getCurrentCompanyId() {
  // Reserved for future multi-tenant SyncAdapter; not used locally.
  return null;
}

// ---------- mappers between domain types and SyncableRecord ----------
function recordToClient(r: ClientRecord): Client {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    notes: r.notes,
    createdAt: r.createdAt,
  };
}

function recordToAppt(r: AppointmentRecord): Appointment {
  return {
    id: r.id,
    clientId: r.clientId,
    clientName: r.clientName,
    date: r.date,
    time: r.time,
    service: r.service,
    services: r.services ?? [],
    materials: r.materials ?? [],
    price: r.price,
    notes: r.notes,
    status: r.status,
    completedAt: r.completedAt,
    extraValue: r.extraValue,
    extraReason: r.extraReason,
    professionalId: r.professionalId,
    createdAt: r.createdAt,
  };
}

// ---------- hydration ----------
async function loadFromDexie() {
  const [cs, as] = await Promise.all([clientsRepo.list(), appointmentsRepo.list()]);
  _clients = (cs as ClientRecord[]).map(recordToClient);
  _appts = (as as AppointmentRecord[]).map(recordToAppt);
  _hydrated = true;
  emit();
}

/**
 * Hydrate the in-memory cache from IndexedDB. The `userId` argument is kept for
 * backward compatibility with AuthContext — it just tags the local session.
 * Safe to call when offline or unauthenticated (guest mode passes `"guest"`).
 */
export async function hydrateStores(userId: string) {
  _userId = userId;
  try {
    if (hasLegacyData()) {
      await migrateLegacyData();
    }
    // Pull remote data for authenticated users so rows created via the public
    // booking flow / other devices appear in the local IndexedDB cache.
    if (userId && userId !== "guest") {
      // Wire the real Supabase adapter and start realtime + auto-flush.
      resetSupabaseAdapterScope();
      syncEngine.setAdapter(SupabaseAdapter);
      try {
        await pullFromSupabase(userId);
      } catch (err) {
        console.warn("supabase pull failed (continuing with local data):", err);
      }
      // Flush any outbox entries piled up from earlier sessions.
      void syncEngine.flush();
      void startRealtimeSync(userId);
    }
    await loadFromDexie();
  } catch (err) {
    console.error("hydrateStores failed:", err);
    toast.error("Falha ao carregar dados locais.");
  }
}

export function clearStores() {
  stopRealtimeSync();
  resetSupabaseAdapterScope();
  // Local-first: keep the IndexedDB data on logout, only drop the in-memory cache.
  _clients = [];
  _appts = [];
  _userId = null;
  _hydrated = false;
  emit();
}

// ---------- public API (sync surface, async persistence) ----------
export const clientsStore = {
  list: () => _clients,
  get: (id: string) => _clients.find((c) => c.id === id),
  save: (c: Client) => {
    const idx = _clients.findIndex((x) => x.id === c.id);
    if (idx >= 0) _clients[idx] = c;
    else _clients = [..._clients, c];
    emit();
    void persistClient(c, idx >= 0);
  },
  remove: (id: string) => {
    _clients = _clients.filter((c) => c.id !== id);
    _appts = _appts.filter((a) => a.clientId !== id);
    emit();
    void clientsRepo.remove(id).then(() => syncEngine.flush()).catch((e) => {
      console.error("clientsRepo.remove failed:", e);
      toast.error("Falha ao remover cliente.");
    });
  },
};

export const appointmentsStore = {
  list: () => _appts,
  byClient: (clientId: string) => _appts.filter((a) => a.clientId === clientId),
  save: (a: Appointment) => {
    const idx = _appts.findIndex((x) => x.id === a.id);
    if (idx >= 0) _appts[idx] = a;
    else _appts = [..._appts, a];
    emit();
    void persistAppt(a, idx >= 0);
  },
  remove: (id: string) => {
    _appts = _appts.filter((a) => a.id !== id);
    emit();
    void appointmentsRepo.remove(id).then(() => syncEngine.flush()).catch((e) => {
      console.error("appointmentsRepo.remove failed:", e);
      toast.error("Falha ao remover atendimento.");
    });
  },
};

async function persistClient(c: Client, isUpdate: boolean) {
  try {
    const payload = {
      id: c.id,
      name: c.name,
      phone: c.phone,
      notes: c.notes,
    } as Omit<ClientRecord, "createdAt" | "updatedAt" | "version" | "syncStatus" | "deletedAt" | "remoteId">;
    const existing = await clientsRepo.get(c.id);
    if (existing || isUpdate) {
      await clientsRepo.update(c.id, payload);
    } else {
      await clientsRepo.create(payload);
    }
    void syncEngine.flush();
  } catch (e) {
    console.error("persistClient failed:", e);
    toast.error("Falha ao salvar cliente localmente.");
  }
}

async function persistAppt(a: Appointment, isUpdate: boolean) {
  try {
    const payload = {
      id: a.id,
      clientId: a.clientId,
      clientName: a.clientName,
      date: a.date,
      time: a.time,
      service: a.service,
      services: a.services ?? [],
      materials: a.materials ?? [],
      price: a.price,
      notes: a.notes,
      status: a.status,
      completedAt: a.completedAt,
      extraValue: a.extraValue,
      extraReason: a.extraReason,
      professionalId: a.professionalId,
    } as Omit<AppointmentRecord, "createdAt" | "updatedAt" | "version" | "syncStatus" | "deletedAt" | "remoteId">;
    const existing = await appointmentsRepo.get(a.id);
    if (existing || isUpdate) {
      await appointmentsRepo.update(a.id, payload);
    } else {
      await appointmentsRepo.create(payload);
    }
    void syncEngine.flush();
  } catch (e) {
    console.error("persistAppt failed:", e);
    toast.error("Falha ao salvar atendimento localmente.");
  }
}

export function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------- migration from legacy localStorage ----------
const LEGACY_CLIENTS = "manicure_clients_v1";
const LEGACY_APPTS = "manicure_appointments_v1";

export function hasLegacyData(): boolean {
  try {
    const c = JSON.parse(localStorage.getItem(LEGACY_CLIENTS) || "[]");
    const a = JSON.parse(localStorage.getItem(LEGACY_APPTS) || "[]");
    return (c.length || 0) + (a.length || 0) > 0;
  } catch {
    return false;
  }
}

export async function migrateLegacyData(): Promise<{ clients: number; appointments: number }> {
  const legacyClients: Client[] = JSON.parse(localStorage.getItem(LEGACY_CLIENTS) || "[]");
  const legacyAppts: Appointment[] = JSON.parse(localStorage.getItem(LEGACY_APPTS) || "[]");

  const now = new Date().toISOString();
  const clientRecords: ClientRecord[] = legacyClients.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    notes: c.notes,
    createdAt: c.createdAt || now,
    updatedAt: now,
    version: 1,
    syncStatus: "pending",
    deletedAt: null,
    remoteId: null,
  }));

  const apptRecords: AppointmentRecord[] = legacyAppts.map((a) => ({
    id: a.id,
    clientId: a.clientId,
    clientName: a.clientName,
    date: a.date,
    time: a.time,
    service: a.service,
    services: a.services ?? [],
    materials: a.materials ?? [],
    price: a.price,
    notes: a.notes,
    status: a.status,
    completedAt: a.completedAt,
    extraValue: a.extraValue,
    extraReason: a.extraReason,
    professionalId: a.professionalId,
    createdAt: a.createdAt || now,
    updatedAt: now,
    version: 1,
    syncStatus: "pending",
    deletedAt: null,
    remoteId: null,
  }));

  if (clientRecords.length) await clientsRepo.upsertMany(clientRecords);
  if (apptRecords.length) await appointmentsRepo.upsertMany(apptRecords);

  // backup then clear legacy keys
  localStorage.setItem(LEGACY_CLIENTS + "_migrated", localStorage.getItem(LEGACY_CLIENTS) || "");
  localStorage.setItem(LEGACY_APPTS + "_migrated", localStorage.getItem(LEGACY_APPTS) || "");
  localStorage.removeItem(LEGACY_CLIENTS);
  localStorage.removeItem(LEGACY_APPTS);

  await loadFromDexie();
  return { clients: clientRecords.length, appointments: apptRecords.length };
}
