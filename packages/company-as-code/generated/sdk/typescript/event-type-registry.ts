// Generated from /schemas/event-type-registry.schema.json — do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** Dotted, lowercase + snake_case event type. Leading segment is the emitting domain or module. Kept byte-identical with event.schema.json#/$defs/eventType (enforced by test). */
export type EventType = string;

/** The enum-controlled registry of typed event names. One document for the company. Adding a new type requires a schema migration and an ADR. */
export interface EventTypeRegistry {
  apiVersion: "company-as-code/v1";
  kind: "EventTypeRegistry";
  /** Registry schema version. Bumped only via ADR + migration. */
  version: number;
  events: Array<{
    /** Dotted, lowercase + snake_case. Leading segment is the emitting domain or module. */
    type: EventType;
    description: string;
    emittingModule: string;
    /** Optional repo-relative path to the JSON-Schema-flavoured payload definition. */
    payloadSchema?: string;
    status: "experimental" | "stable" | "deprecated";
    deprecatedAt?: string;
    removeAfter?: string;
  }>;
}
