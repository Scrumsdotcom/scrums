# ADR 0003: Unidirectional mutation flow

- **Status:** Accepted
- **Date:** 2026-05-13
- **Deciders:** Seed maintainers
- **Tags:** architecture, data, mutation

## Context

The framework spans many modules and many external systems. Every system that mutates state is a potential source of correctness drift, sync hell, and "system A wrote something system B then overwrote" defects.

The two viable extremes:

1. **Free mutation** — any module, any integration may write any field at any time. Conflicts resolved at read time. Lowest authoring cost; highest debugging cost.
2. **Single writer per field** — every field has exactly one writer; everything else reads. Highest authoring discipline; lowest debugging cost.

Forks of the framework span industries (finance-heavy, ops-heavy, communications-heavy) and stages (small startup, mid-stage SaaS, complex consultancy). The framework must commit to a default that scales — and the scaling axis that matters is **debuggability under unfamiliar incident conditions**, not authoring convenience on day one.

## Decision

Mutation flow is **unidirectional** by default:

- **Every field has exactly one writer.** Everything else reads.
- **Writebacks** from the coordination layer to external systems are explicit, gated by HITL (ADR see [`/company/policies/hitl-external-writes.md`](../../company/policies/hitl-external-writes.md)), and never autonomous unless the path has accumulated reliability evidence.
- **Circular sync** (A writes → B writes back → A writes again) is treated as a defect, not a feature.
- **Fields that need to round-trip** require a documented conflict-resolution protocol: which side wins, under what conditions, and how conflicts are detected.

The integration manifest's `mutationDirection` field captures this for external systems:

- `read-only` — preferred for most integrations
- `write-only` — for systems we author into without reading back
- `writeback-only` — for systems where the coordination layer is authoritative and writes flow outward
- `read-write` — only with a documented conflict-resolution protocol

## Consequences

**Positive**

- Audit log narratives are linear and queryable.
- Incident response can trace state changes deterministically.
- Vendor swaps are mapping changes, not architecture rewrites.
- The runtime can refuse contradictory writes at the policy layer instead of trying to reconcile them after.

**Negative**

- Authoring is more demanding — every field needs an explicit owner.
- "Quick" two-way syncs become explicit protocols, which slows down some integrations.
- Migrating an existing bidirectional integration into the framework requires picking a primary and recording a protocol for the secondary.

**Neutral**

- Most apparent bidirectional needs can be solved by splitting fields between systems — one owns the canonical value, the other owns a derived view.

## Alternatives considered

- **Free mutation.** Rejected. The framework's audience includes operationally-stretched startups and consultancies — the debugging cost of free mutation falls disproportionately on the people least able to absorb it.
- **Last-write-wins conflict resolution.** Rejected as a default. LWW is a valid strategy for specific surfaces, but as a framework default it produces silent data loss.
- **CRDTs.** Rejected as too specific. The framework cannot pick a CRDT library on behalf of every fork; forks that need CRDTs can adopt them per-field.

## Implementation notes

- Integration schema (`/schemas/integration.schema.json`) carries `mutationDirection` as a required field.
- Workflow schema's `live-write` step kind is the canonical mutation surface; `dry-run` precedes it.
- The audit log captures every write attempt; the typed event ledger captures every successful state change.
- The `sync-verification` skill operationalizes this for every state-mutating sync.

## Links

- Spec section: "Unidirectional mutation flow"
- Spec section: "Data topology: coordinate, don't replicate"
- ADR-0002: Modular monolith as the canonical structure
- Skill: [`sync-verification`](../../company/skills/sync-verification.yaml)
- Policy: [`/company/policies/hitl-external-writes.md`](../../company/policies/hitl-external-writes.md)
