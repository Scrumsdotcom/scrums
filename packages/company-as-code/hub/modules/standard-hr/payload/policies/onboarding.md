# Policy: Worker Onboarding

> Scaffolded from the CaC-Hub `standard-hr` module.

## Rule

Every new worker is onboarded through a dry-run-then-live sequence. The
coordination layer issues the canonical worker ID; external accounts are
projected as a dry-run, reviewed by a human, then provisioned.

## Sequence

1. **Issue canonical ID.** A `canonical_workers` row is created. The canonical
   worker ID is permanent — rehires reuse it.
2. **Dry-run provisioning.** The onboarding workflow computes the full set of
   accounts, group memberships, and access grants it *would* create, and writes
   a single audit record with that projection.
3. **HITL approval.** A human with the `accountable` role reviews the projection
   in the HITL inbox and approves or rejects it. No autonomous provisioning.
4. **Live provisioning.** On approval, the live writes fire, each emitting a
   typed event against the canonical worker ID.
5. **Re-verify.** Counts are re-queried and compared to the dry-run projection.

## Invariants

- Access grants to external systems are always HITL-gated.
- No onboarding step writes live before a dry-run audit record exists in the
  same correlation.
- Offboarding tombstones the worker record; it is never hard-deleted.

## Forbidden

- Autonomous account creation.
- Provisioning before the canonical worker ID exists.
- Skipping the dry-run on "obvious" cases — the dry-run is the audit trail.
