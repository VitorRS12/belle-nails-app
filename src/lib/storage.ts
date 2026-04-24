import { Appointment, Client } from "./types";

const CLIENTS_KEY = "manicure_clients_v1";
const APPTS_KEY = "manicure_appointments_v1";

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("manicure:update"));
}

export const clientsStore = {
  list: () => read<Client>(CLIENTS_KEY),
  save: (c: Client) => {
    const all = read<Client>(CLIENTS_KEY);
    const idx = all.findIndex((x) => x.id === c.id);
    if (idx >= 0) all[idx] = c;
    else all.push(c);
    write(CLIENTS_KEY, all);
  },
  remove: (id: string) => {
    write(CLIENTS_KEY, read<Client>(CLIENTS_KEY).filter((c) => c.id !== id));
  },
  get: (id: string) => read<Client>(CLIENTS_KEY).find((c) => c.id === id),
};

export const appointmentsStore = {
  list: () => read<Appointment>(APPTS_KEY),
  save: (a: Appointment) => {
    const all = read<Appointment>(APPTS_KEY);
    const idx = all.findIndex((x) => x.id === a.id);
    if (idx >= 0) all[idx] = a;
    else all.push(a);
    write(APPTS_KEY, all);
  },
  remove: (id: string) => {
    write(APPTS_KEY, read<Appointment>(APPTS_KEY).filter((a) => a.id !== id));
  },
  byClient: (clientId: string) =>
    read<Appointment>(APPTS_KEY).filter((a) => a.clientId === clientId),
};

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
