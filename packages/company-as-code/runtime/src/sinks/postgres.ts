import pg from "pg";
import type { AuditRecord, TypedEvent } from "../types.js";
import type { AuditSink, EventSink } from "./types.js";

/**
 * Postgres production-grade backend.
 *
 * Config via env (PG-style) or a connection string. Append-only by
 * convention; tables use unique constraints on id but never expose UPDATE
 * or DELETE through this interface.
 *
 * On first connection the adapter ensures tables exist; in production
 * forks should manage schema via dedicated migrations.
 */
export class PostgresSinks {
  private readonly pool: pg.Pool;
  private migrated = false;

  constructor(opts: pg.PoolConfig | string = {}) {
    this.pool = new pg.Pool(typeof opts === "string" ? { connectionString: opts } : opts);
  }

  private async ensureSchema(): Promise<void> {
    if (this.migrated) return;
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_records (
          id TEXT PRIMARY KEY,
          actor_kind TEXT NOT NULL,
          actor_id TEXT NOT NULL,
          action TEXT NOT NULL,
          module TEXT,
          workflow TEXT,
          agent TEXT,
          started_at TIMESTAMPTZ NOT NULL,
          completed_at TIMESTAMPTZ,
          duration_ms BIGINT,
          status TEXT NOT NULL,
          dry_run BOOLEAN NOT NULL DEFAULT false,
          input_json JSONB,
          output_json JSONB,
          error_json JSONB,
          correlation_id TEXT,
          causation_id TEXT,
          target_system TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_audit_correlation
          ON audit_records(correlation_id, started_at);

        CREATE TABLE IF NOT EXISTS typed_events (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          entity_canonical_id TEXT NOT NULL,
          entity_kind TEXT NOT NULL,
          occurred_at TIMESTAMPTZ NOT NULL,
          recorded_at TIMESTAMPTZ,
          actor_kind TEXT NOT NULL,
          actor_id TEXT NOT NULL,
          payload_json JSONB,
          from_state TEXT,
          to_state TEXT,
          correlation_id TEXT,
          causation_id TEXT,
          source_module TEXT,
          source_workflow TEXT,
          source_agent TEXT,
          schema_version TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_events_entity
          ON typed_events(entity_canonical_id, occurred_at);
        CREATE INDEX IF NOT EXISTS idx_events_type
          ON typed_events(type, occurred_at);
        CREATE INDEX IF NOT EXISTS idx_events_correlation
          ON typed_events(correlation_id, occurred_at);
      `);
      this.migrated = true;
    } finally {
      client.release();
    }
  }

  audit(): AuditSink {
    return {
      record: async (row: AuditRecord) => {
        await this.ensureSchema();
        await this.pool.query(
          `INSERT INTO audit_records (
            id, actor_kind, actor_id, action, module, workflow, agent,
            started_at, completed_at, duration_ms, status, dry_run,
            input_json, output_json, error_json,
            correlation_id, causation_id, target_system
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12,
            $13, $14, $15,
            $16, $17, $18
          )`,
          [
            row.id,
            row.actor.kind,
            row.actor.id,
            row.action,
            row.module ?? null,
            row.workflow ?? null,
            row.agent ?? null,
            row.startedAt,
            row.completedAt ?? null,
            row.durationMs ?? null,
            row.status,
            !!row.dryRun,
            row.input === undefined ? null : JSON.stringify(row.input),
            row.output === undefined ? null : JSON.stringify(row.output),
            row.error ? JSON.stringify(row.error) : null,
            row.correlationId ?? null,
            row.causationId ?? null,
            row.targetSystem ?? null,
          ],
        );
      },
      byCorrelation: async (correlationId: string) => {
        await this.ensureSchema();
        const res = await this.pool.query(
          `SELECT * FROM audit_records WHERE correlation_id = $1 ORDER BY started_at ASC`,
          [correlationId],
        );
        return res.rows.map(rowToAudit);
      },
      ready: async () => {
        try {
          await this.pool.query("SELECT 1");
          return true;
        } catch {
          return false;
        }
      },
      close: async () => {
        /* pool closed via PostgresSinks.close() */
      },
    };
  }

  events(): EventSink {
    return {
      emit: async (event: TypedEvent) => {
        await this.ensureSchema();
        await this.pool.query(
          `INSERT INTO typed_events (
            id, type, entity_canonical_id, entity_kind,
            occurred_at, recorded_at, actor_kind, actor_id,
            payload_json, from_state, to_state,
            correlation_id, causation_id,
            source_module, source_workflow, source_agent,
            schema_version
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7, $8,
            $9, $10, $11,
            $12, $13,
            $14, $15, $16,
            $17
          )`,
          [
            event.id,
            event.type,
            event.entity.canonicalId,
            event.entity.kind,
            event.occurredAt,
            event.recordedAt ?? null,
            event.actor.kind,
            event.actor.id,
            event.payload ? JSON.stringify(event.payload) : null,
            event.from ?? null,
            event.to ?? null,
            event.correlationId ?? null,
            event.causationId ?? null,
            event.source?.module ?? null,
            event.source?.workflow ?? null,
            event.source?.agent ?? null,
            event.schemaVersion ?? null,
          ],
        );
      },
      byEntity: async (canonicalId: string, opts?: { limit?: number }) => {
        await this.ensureSchema();
        const res = await this.pool.query(
          `SELECT * FROM typed_events WHERE entity_canonical_id = $1 ORDER BY occurred_at ASC LIMIT $2`,
          [canonicalId, opts?.limit ?? 1000],
        );
        return res.rows.map(rowToEvent);
      },
      byType: async (type: string, opts?: { limit?: number }) => {
        await this.ensureSchema();
        const res = await this.pool.query(
          `SELECT * FROM typed_events WHERE type = $1 ORDER BY occurred_at ASC LIMIT $2`,
          [type, opts?.limit ?? 1000],
        );
        return res.rows.map(rowToEvent);
      },
      ready: async () => {
        try {
          await this.pool.query("SELECT 1");
          return true;
        } catch {
          return false;
        }
      },
      close: async () => {},
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

function rowToAudit(r: any): AuditRecord {
  return {
    apiVersion: "company-as-code/v1",
    kind: "AuditRecord",
    id: r.id,
    actor: { kind: r.actor_kind, id: r.actor_id },
    action: r.action,
    module: r.module ?? undefined,
    workflow: r.workflow ?? undefined,
    agent: r.agent ?? undefined,
    startedAt: r.started_at instanceof Date ? r.started_at.toISOString() : r.started_at,
    completedAt: r.completed_at ? (r.completed_at instanceof Date ? r.completed_at.toISOString() : r.completed_at) : undefined,
    durationMs: r.duration_ms ?? undefined,
    status: r.status,
    dryRun: !!r.dry_run,
    input: r.input_json ?? undefined,
    output: r.output_json ?? undefined,
    error: r.error_json ?? undefined,
    correlationId: r.correlation_id ?? undefined,
    causationId: r.causation_id ?? undefined,
    targetSystem: r.target_system ?? undefined,
  };
}

function rowToEvent(r: any): TypedEvent {
  return {
    apiVersion: "company-as-code/v1",
    kind: "Event",
    id: r.id,
    type: r.type,
    entity: { canonicalId: r.entity_canonical_id, kind: r.entity_kind },
    occurredAt: r.occurred_at instanceof Date ? r.occurred_at.toISOString() : r.occurred_at,
    recordedAt: r.recorded_at ? (r.recorded_at instanceof Date ? r.recorded_at.toISOString() : r.recorded_at) : undefined,
    actor: { kind: r.actor_kind, id: r.actor_id },
    payload: r.payload_json ?? undefined,
    from: r.from_state ?? undefined,
    to: r.to_state ?? undefined,
    correlationId: r.correlation_id ?? undefined,
    causationId: r.causation_id ?? undefined,
    source: r.source_module || r.source_workflow || r.source_agent
      ? {
          module: r.source_module ?? undefined,
          workflow: r.source_workflow ?? undefined,
          agent: r.source_agent ?? undefined,
        }
      : undefined,
    schemaVersion: r.schema_version ?? undefined,
  };
}
