import { db } from "../db";
import type { OutboxEntry, SyncStatus } from "../types";

/**
 * Contract any future backend adapter must implement.
 * Swap NullAdapter for SupabaseAdapter / RestAdapter when wiring a backend.
 */
export interface SyncAdapter {
  readonly name: string;
  push(entry: OutboxEntry): Promise<{ remoteId?: string; status: SyncStatus }>;
  pull?(since?: string): Promise<void>;
}

export const NullAdapter: SyncAdapter = {
  name: "null",
  async push() {
    // No backend configured yet — keep entries pending in the outbox.
    return { status: "pending" };
  },
};

class SyncEngine {
  private adapter: SyncAdapter = NullAdapter;
  private running = false;

  setAdapter(adapter: SyncAdapter) {
    this.adapter = adapter;
  }

  /** Process pending outbox entries with the active adapter. */
  async flush(): Promise<{ processed: number; failed: number }> {
    if (this.running) return { processed: 0, failed: 0 };
    if (this.adapter === NullAdapter) return { processed: 0, failed: 0 };
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return { processed: 0, failed: 0 };
    }
    this.running = true;
    let processed = 0;
    let failed = 0;
    try {
      const entries = await db.outbox.orderBy("createdAt").toArray();
      for (const entry of entries) {
        try {
          const result = await this.adapter.push(entry);
          if (result.status === "synced") {
            await db.outbox.delete(entry.id);
            processed++;
          } else if (result.status === "conflict") {
            await db.outbox.update(entry.id, { lastError: "conflict" });
            failed++;
          }
        } catch (err) {
          failed++;
          await db.outbox.update(entry.id, {
            attempts: entry.attempts + 1,
            lastError: err instanceof Error ? err.message : String(err),
          });
        }
      }
    } finally {
      this.running = false;
    }
    return { processed, failed };
  }

  async pendingCount(): Promise<number> {
    return db.outbox.count();
  }
}

export const syncEngine = new SyncEngine();
