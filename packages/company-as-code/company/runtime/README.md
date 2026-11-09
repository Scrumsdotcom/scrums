# /company/runtime

Execution surface configuration. This is where the autonomy classification policy, escalation rules, dry-run defaults, and retry budgets are declared.

The runtime enforces the classifications declared on agents and workflows:

- `autonomous` actions fire without human intervention
- `human-gated` actions require explicit human confirmation
- `escalated` actions fire up to a threshold, then escalate

Schedules attached to `human-gated` workflows fail validation here.

## Contents

| File | Role |
|---|---|
| [`autonomy-policy.yaml`](./autonomy-policy.yaml) | Operational expression of the three autonomy classes; promotion path; preflight checks. |
| [`escalation-policy.yaml`](./escalation-policy.yaml) | Severity → SLA mapping; on-call role definitions; vendor-neutral channel routing. |

## How the runtime uses these

At invocation time the runtime applies the preflight checks declared in `autonomy-policy.yaml`. Refusals are recorded in the audit log with the failing check name. Operators see refusals as explicit errors, not silent skips.

The escalation policy resolves role identifiers (e.g. `on-call-platform`) to canonical Person IDs by looking up the binding under [`/company/integrations/seeds/`](../integrations/seeds). Replacing an on-call provider (paging system, chat tool, email gateway) changes the channel routing, not the policy.

## Schema status

The two YAMLs above are illustrative. They are not yet schema-validated. A `RuntimeConfig` schema is on the roadmap so the runtime's own configuration can be machine-validated alongside other primitives. Track via a future ADR.
