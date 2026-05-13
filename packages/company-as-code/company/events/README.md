# /company/events

Typed event ledger. One row per state transition on a canonical entity.

This directory holds:

- the **event type registry** — every enum-typed event the runtime emits
- per-type **payload schemas** — what each event carries
- topic-to-consumer mappings

New event types require a schema migration and an ADR. The event ledger is distinct from the [audit log](../observability) — they are not interchangeable.

Validate event rows against [`/schemas/event.schema.json`](../../schemas/event.schema.json).
