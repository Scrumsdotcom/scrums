import { describe, expect, it, afterEach } from "vitest";
import { SqliteStateStore, hashState } from "../src/state/store.js";

let store: SqliteStateStore | undefined;
afterEach(() => {
  store?.close();
  store = undefined;
});

describe("SqliteStateStore — versioned state snapshotting", () => {
  it("registers canonical entities and system mappings", () => {
    store = new SqliteStateStore(":memory:");
    store.registerEntity({ canonicalId: "cust-001", kind: "customer", l1Bucket: "active" });
    store.mapSystem({ canonicalId: "cust-001", system: "crm", externalId: "CRM-99" });
    store.mapSystem({ canonicalId: "cust-001", system: "billing", externalId: "BL-7" });

    expect(store.listEntities()).toHaveLength(1);
    expect(store.listMappings()).toHaveLength(2);
    expect(store.getEntity("cust-001")?.kind).toBe("customer");
  });

  it("mapping insert is idempotent on (canonicalId, system, externalId)", () => {
    store = new SqliteStateStore(":memory:");
    store.registerEntity({ canonicalId: "cust-001", kind: "customer", l1Bucket: "active" });
    store.mapSystem({ canonicalId: "cust-001", system: "crm", externalId: "CRM-99" });
    store.mapSystem({ canonicalId: "cust-001", system: "crm", externalId: "CRM-99" });
    expect(store.listMappings()).toHaveLength(1);
  });

  it("captures a content-hashed snapshot of the whole canonical state", () => {
    store = new SqliteStateStore(":memory:");
    store.registerEntity({ canonicalId: "cust-001", kind: "customer", l1Bucket: "active" });
    store.mapSystem({ canonicalId: "cust-001", system: "crm", externalId: "CRM-99" });

    const snap = store.createSnapshot("baseline");
    expect(snap.label).toBe("baseline");
    expect(snap.entityCount).toBe(1);
    expect(snap.mappingCount).toBe(1);
    expect(snap.contentHash).toMatch(/^[0-9a-f]{64}$/);

    const full = store.getSnapshot(snap.id)!;
    expect(full.entities).toHaveLength(1);
    expect(full.mappings).toHaveLength(1);
  });

  it("rolls the live canonical state back to a snapshot atomically", () => {
    store = new SqliteStateStore(":memory:");
    store.registerEntity({ canonicalId: "cust-001", kind: "customer", l1Bucket: "active" });
    store.mapSystem({ canonicalId: "cust-001", system: "crm", externalId: "CRM-99" });
    const good = store.createSnapshot("known-good");

    // A workflow "fails" — it leaves bad state behind.
    store.registerEntity({ canonicalId: "cust-BOGUS", kind: "customer", l1Bucket: "active" });
    store.mapSystem({ canonicalId: "cust-001", system: "crm", externalId: "CRM-WRONG" });
    expect(store.listEntities()).toHaveLength(2);
    expect(store.listMappings()).toHaveLength(2);

    const result = store.rollbackTo(good.id);
    expect(result.restoredEntities).toBe(1);
    expect(result.restoredMappings).toBe(1);
    expect(store.listEntities()).toHaveLength(1);
    expect(store.listMappings()).toHaveLength(1);
    expect(store.getEntity("cust-BOGUS")).toBeUndefined();

    // State now hashes identically to the snapshot it was restored from.
    expect(hashState(store.listEntities(), store.listMappings())).toBe(good.contentHash);
  });

  it("rollback is itself reversible — snapshots are never deleted", () => {
    store = new SqliteStateStore(":memory:");
    store.registerEntity({ canonicalId: "a", kind: "task", l1Bucket: "open" });
    const first = store.createSnapshot("first");
    store.registerEntity({ canonicalId: "b", kind: "task", l1Bucket: "open" });
    const second = store.createSnapshot("second");

    store.rollbackTo(first.id);
    expect(store.listEntities()).toHaveLength(1);
    // The "second" snapshot still exists and is reachable.
    store.rollbackTo(second.id);
    expect(store.listEntities()).toHaveLength(2);
    expect(store.listSnapshots()).toHaveLength(2);
  });

  it("rollback throws on an unknown snapshot ID", () => {
    store = new SqliteStateStore(":memory:");
    expect(() => store!.rollbackTo("snap-nope")).toThrow(/not found/);
  });

  it("hashState is order-independent", () => {
    const e1 = { canonicalId: "a", kind: "task", l1Bucket: "open", createdAt: "2026-01-01T00:00:00Z" };
    const e2 = { canonicalId: "b", kind: "task", l1Bucket: "open", createdAt: "2026-01-01T00:00:00Z" };
    expect(hashState([e1, e2], [])).toBe(hashState([e2, e1], []));
  });
});
