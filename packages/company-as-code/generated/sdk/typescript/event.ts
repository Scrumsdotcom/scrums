// Generated from /schemas/event.schema.json, do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** Dotted, lowercase + snake_case event type. Leading segment is the emitting domain or module. Kept byte-identical with event-type-registry.schema.json#/$defs/eventType (enforced by test). */
export type EventType = string;

/** Typed event ledger row. One row per state transition on a canonical entity. Event types are enum-controlled. */
export interface Event {
  apiVersion: "company-as-code/v1alpha1";
  kind: "Event";
  /** Globally unique event ID (ULID/UUID). */
  id: string;
  /** Enum-typed event name, e.g. 'task.state_changed'. New types require a schema migration. */
  type: EventType;
  entity: {
    canonicalId: string;
    /** Canonical entity type, e.g. 'task', 'initiative', 'customer'. */
    kind: string;
  };
  occurredAt: string;
  recordedAt?: string;
  actor: {
    kind: "person" | "agent" | "automation" | "system";
    id: string;
  };
  /** Type-specific payload. Schema governed by the event type registry. */
  payload?: Record<string, unknown>;
  /** Previous state (for state-transition events). */
  from?: string;
  /** New state (for state-transition events). */
  to?: string;
  correlationId?: string;
  causationId?: string;
  source?: {
    module?: string;
    workflow?: string;
    agent?: string;
  };
  schemaVersion?: string;
  /** W3C trace ID (32 hex chars) joining this event to the audit log. */
  traceId?: string;
  /** W3C span ID (16 hex chars) of the step span that emitted this event. */
  spanId?: string;
}
