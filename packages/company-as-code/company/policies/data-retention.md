# Policy: Data retention

**Status:** Active
**Owner:** [Lead maintainer](../../MAINTAINERS.md)
**Last updated:** 2026-05-13
**Enforced by:** Per-table retention configuration in the coordination layer; verified by the `data-retention-audit` agent (planned).

## Rule

Every table in the coordination layer declares a retention horizon. Records beyond the horizon are **archived** (moved to cold storage with a tombstone) — never hard-deleted.

Audit log and typed event ledger have separate retention from canonical state.

## Default retention

| Surface | Retention | Action at end of horizon |
|---|---|---|
| Canonical state (customers, persons, organizations, contracts) | Indefinite while active; 7 years after soft-delete | Archive to cold storage; retain tombstone in primary |
| Typed event ledger | 2 years hot, 5 years cold | Move to cold; ledger view filters to hot by default |
| Audit log | 1 year hot, 6 years cold | Move to cold; investigations re-load on demand |
| Per-agent context bundles | Replaced on every regeneration | None — they are deterministic outputs |
| Generated registries | Replaced on every regeneration | None |
| Memory layer (per-agent) | Indefinite while agent active; 1 year after agent retirement | Archive with the agent's manifest |

## Hard rules

- **Never hard-delete.** Soft-delete with a tombstone (`tombstone.deletedAt`, `tombstone.reason`) is mandatory.
- **Never silently merge.** Merges produce a canonical "merged into" pointer; the surviving canonical ID is recorded.
- **Never overwrite remote state without first reading it.** Concurrent edits are real.

## How to declare retention on a new table

When a module adds a table to its `owns.tables` list, the manifest carries the retention statement in its `invariants`:

```yaml
invariants:
  - canonical_invoices: 7-year retention after soft-delete (regulatory).
  - canonical_invoices: hard-delete is forbidden; tombstones are immutable.
```

For non-default retention, an ADR is required.

## Recovering archived data

Archived records can be brought back into hot storage by:

1. Filing a TASK with the canonical ID and the reason.
2. Approval from the owning module's accountable contact.
3. The runtime emits a `coordination.record_unarchived` event capturing actor and reason.

## Related

- [`/docs/standards/schema-migrations.md`](../../docs/standards/schema-migrations.md) — covers schema-level retention changes
- ADR-0003: Unidirectional mutation flow (records, like fields, have one writer)
- Spec section: "Soft delete and merge patterns"
