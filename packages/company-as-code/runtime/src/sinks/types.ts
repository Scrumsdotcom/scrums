import type { AuditRecord, TypedEvent } from "../types.js";

/**
 * AuditSink — append-only store for "what did the runtime do".
 *
 * Implementations must be append-only and total — calls never overwrite or
 * delete prior records. Queries are diagnostic, not transactional.
 */
export interface AuditSink {
  record(row: AuditRecord): Promise<void>;
  /** Return audit rows sharing a correlation ID, in startedAt order. */
  byCorrelation(correlationId: string): Promise<AuditRecord[]>;
  /** Lightweight readiness check (does the underlying store accept writes). */
  ready(): Promise<boolean>;
  /** Release any held resources (file handles, connection pools). */
  close(): Promise<void>;
}

/**
 * EventSink — append-only typed event ledger.
 *
 * Events are state transitions on canonical entities. The registry at
 * /company/events/event-types.yaml is the enum of allowed types; the
 * sink does not enforce membership — the validator at the dev edge does.
 */
export interface EventSink {
  emit(event: TypedEvent): Promise<void>;
  /** Return events for an entity, in occurredAt order. */
  byEntity(canonicalId: string, opts?: { limit?: number }): Promise<TypedEvent[]>;
  /** Return events of a type, in occurredAt order. */
  byType(type: string, opts?: { limit?: number }): Promise<TypedEvent[]>;
  ready(): Promise<boolean>;
  close(): Promise<void>;
}
