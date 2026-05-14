# Policy: HITL for external writes

**Status:** Active
**Owner:** [Lead maintainer](../../MAINTAINERS.md)
**Last updated:** 2026-05-13
**Enforced by:** schema (`workflow.schema.json` rejects `hitl: true` + scheduled trigger), CI (cross-document discipline check in `cli/src/validate.ts`), runtime.

## Rule

Every write to an external system with real-world consequences is **human-gated by default**. Promotion to autonomous requires:

- Accumulated reliability evidence (≥3 successful invocations through the sync verification protocol on the path being promoted)
- An ADR documenting the promotion
- An updated manifest reflecting the new autonomy class

## Scope

Surfaces always covered by this policy:

- Billing systems (invoice issuance, charge capture, refunds)
- Contract systems (agreement creation, amendment, termination)
- Customer-facing communications (email send, SMS, push notification, in-product modal)
- Public surfaces (status page updates, marketing site changes, social posts)
- Identity / access changes (provisioning, revocation, role changes)
- Production deploys
- Destructive operations against any canonical entity (delete, merge, supersede)

Surfaces that may be autonomous from day one if invariants are preserved:

- Read-only syncs into the coordination layer
- Validation, dry-run, and registry generation
- Roll-up / aggregation jobs that emit no external state change

## How this is declared

Per workflow:

```yaml
hitl: true
trigger:
  kind: human
  actor: people:<role>
steps:
  - id: dry-run-step
    kind: dry-run
    dryRunRequired: true
  - id: approve
    kind: human-approval
    approver: people:<role>
    hitl: true
  - id: live-write
    kind: live-write
    automation: <named-automation>
    onFailure: escalate
```

Per agent:

```yaml
autonomy: human-gated     # or "escalated" with an escalation block
```

## What this prevents

- Scripts written for "just this once" becoming load-bearing without anyone realizing
- Vendor-side bugs propagating silently because there was no human in the loop
- The first run of any new write path going live before being reviewed
- Reliability evidence accumulating in chat logs instead of in the audit trail

## How to request promotion to autonomous

The reliability evidence and the ADR can be produced by hand, or accumulated
and drafted automatically through **Shadow Mode**:

1. `cac-host shadow enroll <agent>` — the agent runs in perpetual dry-run on
   every execution, recording each invocation as reliability evidence.
2. Operators record whether each projection matched the human action
   (`cac-host shadow observe`).
3. `cac-host shadow status <agent>` evaluates the accumulated evidence against
   this policy's promotion bar (the AutonomyPolicy `requires` block).
4. Once the automated gate is met, `cac-host shadow propose <agent> --write`
   drafts the promotion ADR citing the evidence.
5. Review and merge the ADR, updating the affected agent's `autonomy:` field
   (and the workflow's `hitl:` field) in the same PR. Validate, regenerate, ship.

The manual path is the same shape: open an ADR, cite the audit records
(correlation IDs) for the ≥3 successful HITL invocations, update the manifests,
ship in one PR.

## Related

- [`/docs/shadow-mode.md`](../../docs/shadow-mode.md) — the automated evidence + ADR path
- [`/docs/standards/security.md`](../../docs/standards/security.md)
- [`/company/skills/sync-verification.yaml`](../skills/sync-verification.yaml)
- ADR-0003: Unidirectional mutation flow ([`/docs/adr/0003-unidirectional-mutation.md`](../../docs/adr/0003-unidirectional-mutation.md))
