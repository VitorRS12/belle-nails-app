import { supabase } from "@/integrations/supabase/client";
import type { Appointment, Client, Material, ServiceItem } from "./types";
import { toast } from "sonner";

// In-memory cache, hydrated when user logs in
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

// ---------- mappers ----------
type ClientRow = {
  id: string; user_id: string; name: string;
  phone: string | null; notes: string | null; created_at: string;
};
function rowToClient(r: ClientRow): Client {
  return {
    id: r.id, name: r.name,
    phone: r.phone ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
  };
}

type ApptRow = {
  id: string; user_id: string; client_id: string; client_name: string;
  date: string; time: string; service: string;
  services: ServiceItem[]; materials: Material[];
  price: number | string; notes: string | null;
  status: Appointment["status"];
  extra_value: number | string | null; extra_reason: string | null;
  completed_at: string | null; created_at: string;
};
function rowToAppt(r: ApptRow): Appointment {
  return {
    id: r.id, clientId: r.client_id, clientName: r.client_name,
    date: r.date, time: r.time, service: r.service,
    services: Array.isArray(r.services) ? r.services : [],
    materials: Array.isArray(r.materials) ? r.materials : [],
    price: Number(r.price) || 0,
    notes: r.notes ?? undefined,
    status: r.status,
    extraValue: r.extra_value != null ? Number(r.extra_value) : undefined,
    extraReason: r.extra_reason ?? undefined,
    completedAt: r.completed_at ?? undefined,
    createdAt: r.created_at,
  };
}

// ---------- hydration ----------
export async function hydrateStores(userId: string) {
  _userId = userId;
  _hydrated = false;
  const [cRes, aRes] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("appointments").select("*").order("date").limit(1000),
  ]);
  if (cRes.error) toast.error("Erro ao carregar clientes");
  if (aRes.error) toast.error("Erro ao carregar atendimentos");
  _clients = (cRes.data as ClientRow[] | null)?.map(rowToClient) ?? [];
  _appts = (aRes.data as ApptRow[] | null)?.map(rowToAppt) ?? [];
  _hydrated = true;
  emit();
}

export function clearStores() {
  _clients = [];
  _appts = [];
  _userId = null;
  _hydrated = false;
  emit();
}

// ---------- write helpers ----------
async function upsertClient(c: Client) {
  if (!_userId) return;
  const { error } = await supabase.from("clients").upsert({
    id: c.id, user_id: _userId,
    name: c.name,
    phone: c.phone ?? null,
    notes: c.notes ?? null,
  });
  if (error) toast.error("Falha ao salvar cliente: " + error.message);
}

async function upsertAppt(a: Appointment) {
  if (!_userId) return;
  const { error } = await supabase.from("appointments").upsert({
    id: a.id, user_id: _userId,
    client_id: a.clientId, client_name: a.clientName,
    date: a.date, time: a.time,
    service: a.service,
    services: a.services ?? [],
    materials: a.materials ?? [],
    price: a.price,
    notes: a.notes ?? null,
    status: a.status,
    extra_value: a.extraValue ?? null,
    extra_reason: a.extraReason ?? null,
    completed_at: a.completedAt ?? null,
  });
  if (error) toast.error("Falha ao salvar atendimento: " + error.message);
}

// ---------- public API (kept sync) ----------
export const clientsStore = {
  list: () => _clients,
  get: (id: string) => _clients.find((c) => c.id === id),
  save: (c: Client) => {
    const idx = _clients.findIndex((x) => x.id === c.id);
    if (idx >= 0) _clients[idx] = c;
    else _clients = [..._clients, c];
    emit();
    void upsertClient(c);
  },
  remove: (id: string) => {
    _clients = _clients.filter((c) => c.id !== id);
    _appts = _appts.filter((a) => a.clientId !== id);
    emit();
    void supabase.from("clients").delete().eq("id", id).then(({ error }) => {
      if (error) toast.error("Falha ao remover cliente: " + error.message);
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
    void upsertAppt(a);
  },
  remove: (id: string) => {
    _appts = _appts.filter((a) => a.id !== id);
    emit();
    void supabase.from("appointments").delete().eq("id", id).then(({ error }) => {
      if (error) toast.error("Falha ao remover: " + error.message);
    });
  },
};

export function uid() {
  // UUID v4 for DB compatibility
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------- migration from localStorage ----------
const LEGACY_CLIENTS = "manicure_clients_v1";
const LEGACY_APPTS = "manicure_appointments_v1";

export function hasLegacyData(): boolean {
  try {
    const c = JSON.parse(localStorage.getItem(LEGACY_CLIENTS) || "[]");
    const a = JSON.parse(localStorage.getItem(LEGACY_APPTS) || "[]");
    return (c.length || 0) + (a.length || 0) > 0;
  } catch { return false; }
}

export async function migrateLegacyData(): Promise<{ clients: number; appointments: number }> {
  if (!_userId) throw new Error("not authenticated");
  const legacyClients: Client[] = JSON.parse(localStorage.getItem(LEGACY_CLIENTS) || "[]");
  const legacyAppts: Appointment[] = JSON.parse(localStorage.getItem(LEGACY_APPTS) || "[]");

  // map old (non-uuid) ids to fresh uuids
  const idMap = new Map<string, string>();
  const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

  const clientRows = legacyClients.map((c) => {
    const newId = isUuid(c.id) ? c.id : uid();
    idMap.set(c.id, newId);
    return {
      id: newId, user_id: _userId!,
      name: c.name, phone: c.phone ?? null, notes: c.notes ?? null,
      created_at: c.createdAt || new Date().toISOString(),
    };
  });

  const apptRows = legacyAppts.map((a) => {
    const newId = isUuid(a.id) ? a.id : uid();
    return {
      id: newId, user_id: _userId!,
      client_id: idMap.get(a.clientId) ?? a.clientId,
      client_name: a.clientName,
      date: a.date, time: a.time,
      service: a.service,
      services: a.services ?? [],
      materials: a.materials ?? [],
      price: a.price,
      notes: a.notes ?? null,
      status: a.status,
      extra_value: a.extraValue ?? null,
      extra_reason: a.extraReason ?? null,
      completed_at: a.completedAt ?? null,
      created_at: a.createdAt || new Date().toISOString(),
    };
  });

  if (clientRows.length) {
    const { error } = await supabase.from("clients").upsert(clientRows);
    if (error) throw error;
  }
  if (apptRows.length) {
    const { error } = await supabase.from("appointments").upsert(apptRows);
    if (error) throw error;
  }

  // backup then clear
  localStorage.setItem(LEGACY_CLIENTS + "_migrated", localStorage.getItem(LEGACY_CLIENTS) || "");
  localStorage.setItem(LEGACY_APPTS + "_migrated", localStorage.getItem(LEGACY_APPTS) || "");
  localStorage.removeItem(LEGACY_CLIENTS);
  localStorage.removeItem(LEGACY_APPTS);

  await hydrateStores(_userId);
  return { clients: clientRows.length, appointments: apptRows.length };
}
