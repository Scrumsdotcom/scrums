import Database from "better-sqlite3";
import type { AuditRecord, TypedEvent } from "../types.js";
import type { AuditSink, EventSink } from "./types.js";

/**
 * SQLite reference backend.
 *
 * Zero-config: a file path (or `:memory:` for tests). Append-only by
 * convention; the runtime never issues UPDATE or DELETE.
 */
export class SqliteSinks {
  private readonly db: Database.Database;

  constructor(filePath: string) {
    this.db = new Database(filePath);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_records (
        id TEXT PRIMARY KEY,
        actor_kind TEXT NOT NULL,
        actor_id TEXT NOT NULL,
        action TEXT NOT NULL,
        module TEXT,
        workflow TEXT,
        agent TEXT,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        duration_ms INTEGER,
        status TEXT NOT NULL,
        dry_run INTEGER NOT NULL DEFAULT 0,
        input_json TEXT,
        output_json TEXT,
        error_json TEXT,
        correlation_id TEXT,
        causation_id TEXT,
        target_system TEXT,
        trace_id TEXT,
        span_id TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_audit_correlation
        ON audit_records(correlation_id, started_at);
      CREATE INDEX IF NOT EXISTS idx_audit_trace
        ON audit_records(trace_id, started_at);

      CREATE TABLE IF NOT EXISTS typed_events (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        entity_canonical_id TEXT NOT NULL,
        entity_kind TEXT NOT NULL,
        occurred_at TEXT NOT NULL,
        recorded_at TEXT,
        actor_kind TEXT NOT NULL,
        actor_id TEXT NOT NULL,
        payload_json TEXT,
        from_state TEXT,
        to_state TEXT,
        correlation_id TEXT,
        causation_id TEXT,
        source_module TEXT,
        source_workflow TEXT,
        source_agent TEXT,
        schema_version TEXT,
        trace_id TEXT,
        span_id TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_events_entity
        ON typed_events(entity_canonical_id, occurred_at);
      CREATE INDEX IF NOT EXISTS idx_events_type
        ON typed_events(type, occurred_at);
      CREATE INDEX IF NOT EXISTS idx_events_correlation
        ON typed_events(correlation_id, occurred_at);
      CREATE INDEX IF NOT EXISTS idx_events_trace
        ON typed_events(trace_id, occurred_at);
    `);
  }

  audit(): AuditSink {
    return {
      record: async (row: AuditRecord) => {
        this.db
          .prepare(
            `INSERT INTO audit_records (
              id, actor_kind, actor_id, action, module, workflow, agent,
              started_at, completed_at, duration_ms, status, dry_run,
              input_json, output_json, error_json,
              correlation_id, causation_id, target_system, trace_id, span_id
            ) VALUES (
              @id, @actorKind, @actorId, @action, @module, @workflow, @agent,
              @startedAt, @completedAt, @durationMs, @status, @dryRun,
              @inputJson, @outputJson, @errorJson,
              @correlationId, @causationId, @targetSystem, @traceId, @spanId
            )`,
          )
          .run({
            id: row.id,
            actorKind: row.actor.kind,
            actorId: row.actor.id,
            action: row.action,
            module: row.module ?? null,
            workflow: row.workflow ?? null,
            agent: row.agent ?? null,
            startedAt: row.startedAt,
            completedAt: row.completedAt ?? null,
            durationMs: row.durationMs ?? null,
            status: row.status,
            dryRun: row.dryRun ? 1 : 0,
            inputJson: row.input === undefined ? null : JSON.stringify(row.input),
            outputJson: row.output === undefined ? null : JSON.stringify(row.output),
            errorJson: row.error ? JSON.stringify(row.error) : null,
            correlationId: row.correlationId ?? null,
            causationId: row.causationId ?? null,
            targetSystem: row.targetSystem ?? null,
            traceId: row.traceId ?? null,
            spanId: row.spanId ?? null,
          });
      },
      byCorrelation: async (correlationId: string) => {
        const rows = this.db
          .prepare(
            `SELECT * FROM audit_records
             WHERE correlation_id = ?
             ORDER BY started_at ASC`,
          )
          .all(correlationId) as any[];
        return rows.map(rowToAudit);
      },
      byTrace: async (traceId: string) => {
        const rows = this.db
          .prepare(
            `SELECT * FROM audit_records
             WHERE trace_id = ?
             ORDER BY started_at ASC`,
          )
          .all(traceId) as any[];
        return rows.map(rowToAudit);
      },
      ready: async () => true,
      close: async () => {
        /* db.close() is shared at SqliteSinks.close() */
      },
    };
  }

  events(): EventSink {
    return {
      emit: async (event: TypedEvent) => {
        this.db
          .prepare(
            `INSERT INTO typed_events (
              id, type, entity_canonical_id, entity_kind,
              occurred_at, recorded_at, actor_kind, actor_id,
              payload_json, from_state, to_state,
              correlation_id, causation_id,
              source_module, source_workflow, source_agent,
              schema_version, trace_id, span_id
            ) VALUES (
              @id, @type, @canonicalId, @entityKind,
              @occurredAt, @recordedAt, @actorKind, @actorId,
              @payloadJson, @fromState, @toState,
              @correlationId, @causationId,
              @sourceModule, @sourceWorkflow, @sourceAgent,
              @schemaVersion, @traceId, @spanId
            )`,
          )
          .run({
            id: event.id,
            type: event.type,
            canonicalId: event.entity.canonicalId,
            entityKind: event.entity.kind,
            occurredAt: event.occurredAt,
            recordedAt: event.recordedAt ?? null,
            actorKind: event.actor.kind,
            actorId: event.actor.id,
            payloadJson: event.payload ? JSON.stringify(event.payload) : null,
            fromState: event.from ?? null,
            toState: event.to ?? null,
            correlationId: event.correlationId ?? null,
            causationId: event.causationId ?? null,
            sourceModule: event.source?.module ?? null,
            sourceWorkflow: event.source?.workflow ?? null,
            sourceAgent: event.source?.agent ?? null,
            schemaVersion: event.schemaVersion ?? null,
            traceId: event.traceId ?? null,
            spanId: event.spanId ?? null,
          });
      },
      byEntity: async (canonicalId: string, opts?: { limit?: number }) => {
        const limit = opts?.limit ?? 1000;
        const rows = this.db
          .prepare(
            `SELECT * FROM typed_events
             WHERE entity_canonical_id = ?
             ORDER BY occurred_at ASC
             LIMIT ?`,
          )
          .all(canonicalId, limit) as any[];
        return rows.map(rowToEvent);
      },
      byType: async (type: string, opts?: { limit?: number }) => {
        const limit = opts?.limit ?? 1000;
        const rows = this.db
          .prepare(
            `SELECT * FROM typed_events
             WHERE type = ?
             ORDER BY occurred_at ASC
             LIMIT ?`,
          )
          .all(type, limit) as any[];
        return rows.map(rowToEvent);
      },
      byTrace: async (traceId: string, opts?: { limit?: number }) => {
        const limit = opts?.limit ?? 1000;
        const rows = this.db
          .prepare(
            `SELECT * FROM typed_events
             WHERE trace_id = ?
             ORDER BY occurred_at ASC
             LIMIT ?`,
          )
          .all(traceId, limit) as any[];
        return rows.map(rowToEvent);
      },
      ready: async () => true,
      close: async () => {
        /* shared close */
      },
    };
  }

  close(): void {
    this.db.close();
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
    startedAt: r.started_at,
    completedAt: r.completed_at ?? undefined,
    durationMs: r.duration_ms ?? undefined,
    status: r.status,
    dryRun: r.dry_run === 1,
    input: r.input_json ? JSON.parse(r.input_json) : undefined,
    output: r.output_json ? JSON.parse(r.output_json) : undefined,
    error: r.error_json ? JSON.parse(r.error_json) : undefined,
    correlationId: r.correlation_id ?? undefined,
    causationId: r.causation_id ?? undefined,
    targetSystem: r.target_system ?? undefined,
    traceId: r.trace_id ?? undefined,
    spanId: r.span_id ?? undefined,
  };
}

function rowToEvent(r: any): TypedEvent {
  return {
    apiVersion: "company-as-code/v1",
    kind: "Event",
    id: r.id,
    type: r.type,
    entity: { canonicalId: r.entity_canonical_id, kind: r.entity_kind },
    occurredAt: r.occurred_at,
    recordedAt: r.recorded_at ?? undefined,
    actor: { kind: r.actor_kind, id: r.actor_id },
    payload: r.payload_json ? JSON.parse(r.payload_json) : undefined,
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
    traceId: r.trace_id ?? undefined,
    spanId: r.span_id ?? undefined,
  };
}
