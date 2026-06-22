import type { Table } from "dexie";
import { db, newId } from "../db";
import type { OutboxOperation, SyncableRecord } from "../types";

/**
 * Generic repository implementing the local-first contract.
 * Every mutation:
 *   1. updates sync metadata (version, updatedAt, syncStatus='pending')
 *   2. writes to its Dexie table
 *   3. enqueues an entry in the outbox for the future SyncAdapter
 *
 * UI code must never write to Dexie directly — always use a repository.
 */
export class BaseRepository<T extends SyncableRecord> {
  constructor(
    private readonly table: Table<T, string>,
    private readonly entity: string,
  ) {}

  async list(includeDeleted = false): Promise<T[]> {
    const all = await this.table.toArray();
    return includeDeleted ? all : all.filter((r) => !r.deletedAt);
  }

  async get(id: string): Promise<T | undefined> {
    const r = await this.table.get(id);
    if (!r || r.deletedAt) return undefined;
    return r;
  }

  async create(data: Omit<T, keyof SyncableRecord> & Partial<Pick<SyncableRecord, "id">>): Promise<T> {
    const now = new Date().toISOString();
    const record = {
      ...data,
      id: data.id ?? newId(),
      createdAt: now,
      updatedAt: now,
      version: 1,
      syncStatus: "pending",
      deletedAt: null,
      remoteId: null,
    } as unknown as T;
    await db.transaction("rw", this.table, db.outbox, async () => {
      await this.table.put(record);
      await this.enqueue("create", record.id, record);
    });
    return record;
  }

  async update(id: string, patch: Partial<Omit<T, keyof SyncableRecord>>): Promise<T | undefined> {
    const current = await this.table.get(id);
    if (!current) return undefined;
    const next: T = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
      version: (current.version ?? 0) + 1,
      syncStatus: "pending",
    } as T;
    await db.transaction("rw", this.table, db.outbox, async () => {
      await this.table.put(next);
      await this.enqueue("update", id, next);
    });
    return next;
  }

  /** Soft-delete: keeps the row for future sync but hides from list/get. */
  async remove(id: string): Promise<void> {
    const current = await this.table.get(id);
    if (!current) return;
    const next: T = {
      ...current,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: (current.version ?? 0) + 1,
      syncStatus: "pending",
    } as T;
    await db.transaction("rw", this.table, db.outbox, async () => {
      await this.table.put(next);
      await this.enqueue("delete", id, { id });
    });
  }

  /** Upsert used by import/migration flows — bypasses outbox when fromRemote=true. */
  async upsertMany(records: T[], fromRemote = false): Promise<void> {
    const now = new Date().toISOString();
    const prepared = records.map((r) => ({
      ...r,
      createdAt: r.createdAt ?? now,
      updatedAt: r.updatedAt ?? now,
      version: r.version ?? 1,
      syncStatus: fromRemote ? "synced" : (r.syncStatus ?? "pending"),
    })) as T[];
    await db.transaction("rw", this.table, db.outbox, async () => {
      await this.table.bulkPut(prepared);
      if (!fromRemote) {
        for (const r of prepared) await this.enqueue("update", r.id, r);
      }
    });
  }

  private async enqueue(operation: OutboxOperation, entityId: string, payload: unknown) {
    await db.outbox.put({
      id: newId(),
      entity: this.entity,
      entityId,
      operation,
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
      lastError: null,
    });
  }
}
