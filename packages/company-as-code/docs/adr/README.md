# Architecture Decision Records

Numbered, dated, status-tracked records of architectural decisions. Use [`/templates/adr.md`](../../templates/adr.md) to author new records.

| # | Title | Status |
|---|---|---|
| [0001](./0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |

## Adding an ADR

1. Copy `/templates/adr.md` to `0NNN-short-title.md` (next sequential number).
2. Fill in Context, Decision, Consequences, Alternatives, Implementation, Links.
3. Status starts as `Proposed`; ratify by merging the PR that updates the status to `Accepted`.
4. Add a row to the table above.

Status transitions: Proposed → Accepted → (Deprecated | Superseded by ADR-<n>). Never delete a superseded ADR — the history is the audit trail.
