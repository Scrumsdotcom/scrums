# Architecture Decision Records

Numbered, dated, status-tracked records of architectural decisions. Use [`/templates/adr.md`](../../templates/adr.md) to author new records.

| # | Title | Status |
|---|---|---|
| [0001](./0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](./0002-modular-monolith.md) | Modular monolith as the canonical structure | Accepted |
| [0003](./0003-unidirectional-mutation.md) | Unidirectional mutation flow | Accepted |
| [0004](./0004-drift-gate.md) | Generated registries + drift gate | Accepted |
| [0005](./0005-cac-hub-in-repo-registry.md) | CaC-Hub as an in-repo module registry | Accepted |
| [0006](./0006-compliance-and-capability-layer.md) | Compliance and capability as typed primitives | Accepted |
| [0007](./0007-typed-reference-edges.md) | Typed reference edges in the schemas | Accepted |
| [0008](./0008-framework-instance-boundary.md) | A declared boundary between the framework and the instance | Proposed |
| [0009](./0009-honest-versioning.md) | The document format is v1alpha1 until it earns more | Proposed |
| [0010](./0010-conformance-suite.md) | A conformance suite defines correct, not the reference CLI | Proposed |

## Adding an ADR

1. Copy `/templates/adr.md` to `0NNN-short-title.md` (next sequential number).
2. Fill in Context, Decision, Consequences, Alternatives, Implementation, Links.
3. Status starts as `Proposed`; ratify by merging the PR that updates the status to `Accepted`.
4. Add a row to the table above.

Status transitions: Proposed → Accepted → (Deprecated | Superseded by ADR-<n>). Never delete a superseded ADR. The history is the audit trail.
