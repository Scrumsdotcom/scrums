import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { ulid } from "ulid";

/**
 * Versioned state snapshotting.
 *
 * The coordination layer's mutable state is small by design (see the spec's
 * "coordinate, don't replicate"): canonical IDs and the evolving system
 * mappings that point them at external SaaS records. That smallness is what
 * makes snapshotting tractable. We can checkpoint the *entire* canonical
 * state of the company into one row and roll back to it atomically.
 *
 * What this store holds:
 *   - canonical_entities, the permanent internal IDs + their L1 bucket
 *   - system_mappings    # the evolutionary external-system IDs per entity
 *   - state_snapshots    # immutable checkpoints of the two tables above
 *
 * What it deliberately does NOT touch:
 *   - the audit log and the typed-event ledger are append-only and are never
 *     rewound. A rollback is itself an event: the caller records it. History
 *     rolls forward; only the live canonical state is restored.
 */

export interface CanonicalEntity {
  canonicalId: string;
  kind: string;
  /** L1 universal lifecycle bucket. See the canonical state ladder. */
  l1Bucket: string;
  createdAt: string;
  tombstonedAt?: string;
  tombstoneReason?: string;
  /** Canonical ID this entity was merged into, if any (merges are pointers). */
  mergedInto?: string;
}

export interface SystemMapping {
  canonicalId: string;
  /** Canonical name of the external system, e.g. "crm", "billing". */
  system: string;
  /** The ID that external system assigned to this entity. */
  externalId: string;
  createdAt: string;
  /** Set when the external ID was rotated/superseded. */
  rotatedAt?: string;
}

export interface StateSnapshot {
  id: string;
  label?: string;
  createdAt: string;
  /** sha256 of the canonical-JSON snapshot content. Two snapshots with the
   *  same hash captured identical state. */
  contentHash: string;
  entityCount: number;
  mappingCount: number;
}

export interface StateSnapshotContent extends StateSnapshot {
  entities: CanonicalEntity[];
  mappings: SystemMapping[];
}

export interface RollbackResult {
  snapshot: StateSnapshot;
  restoredEntities: number;
  restoredMappings: number;
  /** State immediately before the rollback, hashed, for the audit record. */
  replacedHash: string;
}

export class SqliteStateStore {
  private readonly db: Database.Database;

  constructor(filePath: string) {
    this.db = new Database(filePath);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS canonical_entities (
        canonical_id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        l1_bucket TEXT NOT NULL,
        created_at TEXT NOT NULL,
        tombstoned_at TEXT,
        tombstone_reason TEXT,
        merged_into TEXT
      );

      CREATE TABLE IF NOT EXISTS system_mappings (
        id TEXT PRIMARY KEY,
        canonical_id TEXT NOT NULL,
        system TEXT NOT NULL,
        external_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        rotated_at TEXT,
        UNIQUE (canonical_id, system, external_id)
      );
      CREATE INDEX IF NOT EXISTS idx_mappings_entity
        ON system_mappings(canonical_id);

      CREATE TABLE IF NOT EXISTS state_snapshots (
        id TEXT PRIMARY KEY,
        label TEXT,
        created_at TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        entity_count INTEGER NOT NULL,
        mapping_count INTEGER NOT NULL,
        entities_json TEXT NOT NULL,
        mappings_json TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_snapshots_created
        ON state_snapshots(created_at);
    `);
  }

  // --- canonical entities --------------------------------------------------

  /** Issue (or re-assert) a canonical entity. Canonical IDs are permanent. */
  registerEntity(e: {
    canonicalId: string;
    kind: string;
    l1Bucket: string;
    createdAt?: string;
  }): CanonicalEntity {
    const createdAt = e.createdAt ?? new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO canonical_entities (canonical_id, kind, l1_bucket, created_at)
         VALUES (@canonicalId, @kind, @l1Bucket, @createdAt)
         ON CONFLICT(canonical_id) DO UPDATE SET
           kind = excluded.kind,
           l1_bucket = excluded.l1_bucket`,
      )
      .run({ canonicalId: e.canonicalId, kind: e.kind, l1Bucket: e.l1Bucket, createdAt });
    return this.getEntity(e.canonicalId)!;
  }

  /** Soft-delete: never hard-delete, always tombstone with a reason. */
  tombstoneEntity(canonicalId: string, reason: string): void {
    this.db
      .prepare(
        `UPDATE canonical_entities
         SET tombstoned_at = @at, tombstone_reason = @reason
         WHERE canonical_id = @id`,
      )
      .run({ id: canonicalId, at: new Date().toISOString(), reason });
  }

  getEntity(canonicalId: string): CanonicalEntity | undefined {
    const r = this.db
      .prepare(`SELECT * FROM canonical_entities WHERE canonical_id = ?`)
      .get(canonicalId) as any;
    return r ? rowToEntity(r) : undefined;
  }

  listEntities(): CanonicalEntity[] {
    const rows = this.db
      .prepare(`SELECT * FROM canonical_entities ORDER BY canonical_id ASC`)
      .all() as any[];
    return rows.map(rowToEntity);
  }

  // --- system mappings -----------------------------------------------------

  /** Record the ID an external system assigned to a canonical entity. */
  mapSystem(m: {
    canonicalId: string;
    system: string;
    externalId: string;
    createdAt?: string;
  }): SystemMapping {
    const createdAt = m.createdAt ?? new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO system_mappings (id, canonical_id, system, external_id, created_at)
         VALUES (@id, @canonicalId, @system, @externalId, @createdAt)
         ON CONFLICT(canonical_id, system, external_id) DO NOTHING`,
      )
      .run({ id: ulid(), canonicalId: m.canonicalId, system: m.system, externalId: m.externalId, createdAt });
    return { canonicalId: m.canonicalId, system: m.system, externalId: m.externalId, createdAt };
  }

  listMappings(): SystemMapping[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM system_mappings
         ORDER BY canonical_id ASC, system ASC, external_id ASC`,
      )
      .all() as any[];
    return rows.map(rowToMapping);
  }

  // --- snapshots -----------------------------------------------------------

  /** Capture the entire canonical state into an immutable checkpoint. */
  createSnapshot(label?: string): StateSnapshot {
    const entities = this.listEntities();
    const mappings = this.listMappings();
    const contentHash = hashState(entities, mappings);
    const snapshot: StateSnapshot = {
      id: `snap-${ulid().toLowerCase()}`,
      label,
      createdAt: new Date().toISOString(),
      contentHash,
      entityCount: entities.length,
      mappingCount: mappings.length,
    };
    this.db
      .prepare(
        `INSERT INTO state_snapshots
           (id, label, created_at, content_hash, entity_count, mapping_count, entities_json, mappings_json)
         VALUES (@id, @label, @createdAt, @contentHash, @entityCount, @mappingCount, @entitiesJson, @mappingsJson)`,
      )
      .run({
        id: snapshot.id,
        label: snapshot.label ?? null,
        createdAt: snapshot.createdAt,
        contentHash: snapshot.contentHash,
        entityCount: snapshot.entityCount,
        mappingCount: snapshot.mappingCount,
        entitiesJson: JSON.stringify(entities),
        mappingsJson: JSON.stringify(mappings),
      });
    return snapshot;
  }

  listSnapshots(): StateSnapshot[] {
    const rows = this.db
      .prepare(
        `SELECT id, label, created_at, content_hash, entity_count, mapping_count
         FROM state_snapshots ORDER BY created_at ASC`,
      )
      .all() as any[];
    return rows.map(rowToSnapshotMeta);
  }

  getSnapshot(id: string): StateSnapshotContent | undefined {
    const r = this.db
      .prepare(`SELECT * FROM state_snapshots WHERE id = ?`)
      .get(id) as any;
    if (!r) return undefined;
    return {
      ...rowToSnapshotMeta(r),
      entities: JSON.parse(r.entities_json) as CanonicalEntity[],
      mappings: JSON.parse(r.mappings_json) as SystemMapping[],
    };
  }

  /**
   * Atomically replace the live canonical state with a snapshot's content.
   * Snapshots themselves are never deleted, so a rollback is reversible: take
   * a snapshot first, then roll back, and the pre-rollback state is still a
   * checkpoint you can return to.
   */
  rollbackTo(id: string): RollbackResult {
    const snapshot = this.getSnapshot(id);
    if (!snapshot) {
      throw new Error(`snapshot '${id}' not found`);
    }
    const replacedHash = hashState(this.listEntities(), this.listMappings());

    const tx = this.db.transaction(() => {
      this.db.prepare(`DELETE FROM canonical_entities`).run();
      this.db.prepare(`DELETE FROM system_mappings`).run();
      const insE = this.db.prepare(
        `INSERT INTO canonical_entities
           (canonical_id, kind, l1_bucket, created_at, tombstoned_at, tombstone_reason, merged_into)
         VALUES (@canonicalId, @kind, @l1Bucket, @createdAt, @tombstonedAt, @tombstoneReason, @mergedInto)`,
      );
      for (const e of snapshot.entities) {
        insE.run({
          canonicalId: e.canonicalId,
          kind: e.kind,
          l1Bucket: e.l1Bucket,
          createdAt: e.createdAt,
          tombstonedAt: e.tombstonedAt ?? null,
          tombstoneReason: e.tombstoneReason ?? null,
          mergedInto: e.mergedInto ?? null,
        });
      }
      const insM = this.db.prepare(
        `INSERT INTO system_mappings (id, canonical_id, system, external_id, created_at, rotated_at)
         VALUES (@id, @canonicalId, @system, @externalId, @createdAt, @rotatedAt)`,
      );
      for (const m of snapshot.mappings) {
        insM.run({
          id: ulid(),
          canonicalId: m.canonicalId,
          system: m.system,
          externalId: m.externalId,
          createdAt: m.createdAt,
          rotatedAt: m.rotatedAt ?? null,
        });
      }
    });
    tx();

    return {
      snapshot: {
        id: snapshot.id,
        label: snapshot.label,
        createdAt: snapshot.createdAt,
        contentHash: snapshot.contentHash,
        entityCount: snapshot.entityCount,
        mappingCount: snapshot.mappingCount,
      },
      restoredEntities: snapshot.entities.length,
      restoredMappings: snapshot.mappings.length,
      replacedHash,
    };
  }

  close(): void {
    this.db.close();
  }
}

/** Deterministic sha256 of the canonical state, order-independent. */
export function hashState(
  entities: CanonicalEntity[],
  mappings: SystemMapping[],
): string {
  const sortedEntities = [...entities].sort((a, b) =>
    a.canonicalId.localeCompare(b.canonicalId),
  );
  const sortedMappings = [...mappings].sort((a, b) =>
    (a.canonicalId + a.system + a.externalId).localeCompare(
      b.canonicalId + b.system + b.externalId,
    ),
  );
  const canonical = JSON.stringify({ entities: sortedEntities, mappings: sortedMappings });
  return createHash("sha256").update(canonical).digest("hex");
}

function rowToEntity(r: any): CanonicalEntity {
  return {
    canonicalId: r.canonical_id,
    kind: r.kind,
    l1Bucket: r.l1_bucket,
    createdAt: r.created_at,
    tombstonedAt: r.tombstoned_at ?? undefined,
    tombstoneReason: r.tombstone_reason ?? undefined,
    mergedInto: r.merged_into ?? undefined,
  };
}

function rowToMapping(r: any): SystemMapping {
  return {
    canonicalId: r.canonical_id,
    system: r.system,
    externalId: r.external_id,
    createdAt: r.created_at,
    rotatedAt: r.rotated_at ?? undefined,
  };
}

function rowToSnapshotMeta(r: any): StateSnapshot {
  return {
    id: r.id,
    label: r.label ?? undefined,
    createdAt: r.created_at,
    contentHash: r.content_hash,
    entityCount: r.entity_count,
    mappingCount: r.mapping_count,
  };
}
