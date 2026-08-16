# ADR 0001: Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-05-12
- **Deciders:** Seed maintainers
- **Tags:** documentation, governance

## Context

The framework depends on a small number of high-leverage architectural decisions: the modular monolith discipline, canonical IDs, coordinate-don't-replicate, unidirectional mutation, dry-run as default, HITL as declaration, audit log vs typed event ledger, drift gate on generated files.

Without versioned, reviewable records of those decisions, forks drift in incompatible directions and contributors re-debate settled questions. Wiki documents and prose READMEs have proved insufficient: they are not diffable, not enforceable, and not discoverable from the repo.

## Decision

Adopt Architecture Decision Records (ADRs) as the canonical mechanism for proposing and ratifying architectural changes. ADRs live in `/docs/adr/`, numbered sequentially, and follow the template at [`/templates/adr.md`](../../templates/adr.md).

An ADR is required before:

- breaking changes to any JSON Schema in `/schemas`
- introduction or removal of a canonical primitive
- changes to the modular monolith rules
- changes to the autonomy classification system
- changes to the audit log / event ledger separation
- changes to the drift gate or generator contract

## Consequences

**Positive**

- Decisions are diffable, reviewable, and discoverable.
- Forks can audit which decisions they have inherited or overridden.
- Contributors stop re-debating settled questions because the record is in the repo.

**Negative**

- Small architectural changes incur a documentation overhead.

**Neutral**

- The ADR template carries a `Status` field. Superseded ADRs are kept for the historical record, not deleted.

## Alternatives considered

- **Wiki documents**: not diffable, not enforceable, not discoverable from the repo. Rejected.
- **In-code comments**: survive refactors poorly; bind decisions to a specific commit. Rejected.
- **Issue-tracker decisions**: vendor lock-in, poor discoverability. Rejected.

## Implementation notes

- Template at `/templates/adr.md`.
- ADRs numbered sequentially: `0001-`, `0002-`, …
- Status transitions: Proposed → Accepted → (Deprecated | Superseded by ADR-<n>).
- This ADR (0001) bootstraps the process.

## Links

- Template: [`/templates/adr.md`](../../templates/adr.md)
- Spec section: "Standards as codifiable documents", "Plan-first, park-friendly workflow"
