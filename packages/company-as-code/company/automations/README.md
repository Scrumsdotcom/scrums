# /company/automations

Non-agent automations — deterministic scripts, scheduled jobs, webhook handlers. Lives between the agent layer (autonomous reasoning) and the integration layer (external systems).

Every automation declares its inputs, outputs, mutation surface, invariants, and the audit topic it emits to.

## Agent vs automation

- **Agents** reason. They observe, plan, decide, escalate. AI runtimes typically. Declared in `agent.yaml`.
- **Automations** execute. They take typed inputs, produce typed outputs, have well-known failure modes. Deterministic. Declared here.

A workflow step of `kind: dry-run` or `kind: live-write` references an automation, not an agent.

## Contents

| File | Owner module | Called by |
|---|---|---|
| [`post-period-close.yaml`](./post-period-close.yaml) | `company/domains/finance-ops/finance` | `month-end-close` workflow |
| [`apply-channel-allocation.yaml`](./apply-channel-allocation.yaml) | `company/domains/sales-marketing/growth` | `customer-acquisition` workflow |

## Required fields

Every automation declares:

- `purpose` — one-sentence summary
- `inputs[]` with `dryRun: boolean` always present
- `outputs[]`
- `mutates[]` — which canonical tables or external integrations it writes to
- `invariants[]` — at minimum: "Refuses to write live without a prior dry-run audit record under the same correlation ID"
- `failureModes[]` — known failures with declared behavior
- `observability.auditTopic` — required

## Schema status

Automation YAMLs are illustrative — they are not yet schema-validated. An `Automation` schema is on the roadmap so automations can be machine-validated alongside other primitives. Track via a future ADR.
