import Dexie, { type Table } from "dexie";
import type {
  AppointmentRecord,
  ClientRecord,
  OutboxEntry,
  ProfessionalRecord,
  ServiceRecord,
  SettingRecord,
} from "./types";

/**
 * Local-first database for Belle Nails.
 * All UI reads/writes go through repositories that wrap this Dexie instance.
 * Schema is versioned — never edit an existing version; add a new one.
 */
export class BelleNailsDB extends Dexie {
  clients!: Table<ClientRecord, string>;
  appointments!: Table<AppointmentRecord, string>;
  services!: Table<ServiceRecord, string>;
  professionals!: Table<ProfessionalRecord, string>;
  settings!: Table<SettingRecord, string>;
  outbox!: Table<OutboxEntry, string>;

  constructor() {
    super("belle-nails");
    this.version(1).stores({
      clients: "id, name, syncStatus, updatedAt, deletedAt",
      appointments:
        "id, clientId, date, status, professionalId, syncStatus, updatedAt, deletedAt, [date+time]",
      services: "id, name, area, syncStatus, updatedAt, deletedAt",
      professionals: "id, name, active, syncStatus, updatedAt, deletedAt",
      settings: "id, &key, syncStatus, updatedAt",
      outbox: "id, entity, entityId, createdAt",
    });
  }
}

export const db = new BelleNailsDB();

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
