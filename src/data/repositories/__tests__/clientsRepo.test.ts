import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { db } from "@/data/db";
import { clientsRepo } from "@/data/repositories";

describe("clientsRepo (local-first)", () => {
  beforeEach(async () => {
    await db.clients.clear();
    await db.outbox.clear();
  });

  it("creates a client with sync metadata and enqueues an outbox entry", async () => {
    const c = await clientsRepo.create({ name: "Ana" } as never);
    expect(c.id).toBeTruthy();
    expect(c.syncStatus).toBe("pending");
    expect(c.version).toBe(1);
    expect(await db.outbox.count()).toBe(1);
  });

  it("soft-deletes and hides from list while keeping the row for sync", async () => {
    const c = await clientsRepo.create({ name: "Beatriz" } as never);
    await clientsRepo.remove(c.id);
    const list = await clientsRepo.list();
    expect(list.find((x) => x.id === c.id)).toBeUndefined();
    const raw = await db.clients.get(c.id);
    expect(raw?.deletedAt).toBeTruthy();
  });

  it("increments version on update", async () => {
    const c = await clientsRepo.create({ name: "Carla" } as never);
    const updated = await clientsRepo.update(c.id, { phone: "11" } as never);
    expect(updated?.version).toBe(2);
    expect(updated?.syncStatus).toBe("pending");
  });
});
