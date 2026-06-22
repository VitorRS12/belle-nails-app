/**
 * Shared types for the local-first data layer.
 * Every persisted record carries sync metadata so a future SyncAdapter
 * can reconcile with a remote backend without touching repositories.
 */

export type SyncStatus = "pending" | "synced" | "conflict";

export interface SyncMeta {
  /** ISO timestamp of creation (local clock) */
  createdAt: string;
  /** ISO timestamp of the last local update */
  updatedAt: string;
  /** Soft-delete marker — repositories filter these out by default */
  deletedAt?: string | null;
  /** Monotonic local version, incremented on each update */
  version: number;
  /** Current sync state with respect to the remote backend */
  syncStatus: SyncStatus;
  /** Remote id assigned by the backend once synced */
  remoteId?: string | null;
}

export interface SyncableRecord extends SyncMeta {
  id: string;
}

export type OutboxOperation = "create" | "update" | "delete";

export interface OutboxEntry {
  id: string;
  entity: string;
  entityId: string;
  operation: OutboxOperation;
  payload: unknown;
  createdAt: string;
  attempts: number;
  lastError?: string | null;
}

/* ---------- Domain records ---------- */

import type { Material, ServiceItem } from "@/lib/types";

export interface ClientRecord extends SyncableRecord {
  name: string;
  phone?: string;
  notes?: string;
}

export interface AppointmentRecord extends SyncableRecord {
  clientId: string;
  clientName: string;
  date: string;
  time: string;
  service: string;
  services: ServiceItem[];
  materials: Material[];
  price: number;
  notes?: string;
  status: "scheduled" | "completed" | "cancelled" | "pendente_confirmacao";
  completedAt?: string;
  extraValue?: number;
  extraReason?: string;
  professionalId?: string;
}

export interface ServiceRecord extends SyncableRecord {
  name: string;
  price: number;
  area?: string;
  durationMin?: number;
}

export interface ProfessionalRecord extends SyncableRecord {
  name: string;
  role?: string;
  color?: string;
  active: boolean;
}

export interface SettingRecord extends SyncableRecord {
  key: string;
  value: unknown;
}
