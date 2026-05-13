# /company/policies

Invariants, HITL declarations, security posture, force-push policy, secret handling, dependency review, branch protection, retention. Each policy is a versioned, reviewable document that CI or the runtime can enforce.

If a rule is worth enforcing, it lives here. If it is not in the repo, it is a preference, not a standard.

## Policies in this seed

| Policy | What it constrains |
|---|---|
| [`hitl-external-writes.md`](./hitl-external-writes.md) | Every write to an external system with real-world consequences is human-gated by default. |
| [`data-retention.md`](./data-retention.md) | Per-surface retention horizons; soft-delete with tombstone is mandatory; hard-delete is forbidden. |
| [`incident-response.md`](./incident-response.md) | Severity classification, roles, required artifacts, retrospective cadence. |

## Authoring a new policy

A policy is a markdown document with a status banner, an explicit owner, an enforcement mechanism (schema / CI / runtime / operator discipline), and the rule itself stated plainly.

When the policy is enforceable by the runtime or by CI, the policy doc cross-links to where that enforcement lives. When it isn't (yet) enforceable in code, the policy doc states that explicitly so operators know it relies on discipline.

## Schema status

Policies are markdown today. A `Policy` JSON Schema is on the roadmap so policies can be machine-validated and queried alongside other primitives. Track it via a future ADR.
