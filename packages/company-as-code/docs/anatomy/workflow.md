# Anatomy of a Workflow

A `Workflow` is a multi-step orchestration. Some steps invoke agents; some invoke automations; some require human approval. The combination forms the operational surface where humans and AI execute on the same runtime.

Schema: [`/schemas/workflow.schema.json`](../../schemas/workflow.schema.json). Template: [`/templates/workflow.yaml`](../../templates/workflow.yaml). Worked examples: [`month-end-close`](../../company/domains/finance-ops/finance/workflows/month-end-close.yaml), [`production-deploy`](../../company/domains/product-operations/platform/workflows/production-deploy.yaml), [`customer-acquisition`](../../company/domains/sales-marketing/growth/workflows/customer-acquisition.yaml), [`incident-response`](../../company/workflows/incident-response.yaml).

---

## Required fields

### `apiVersion`, `kind`, `name`, `module`, `purpose`

Same as the other primitives. `module:` must be the workflow's owning module — typically a domain module's `<module>/workflows/<name>.yaml`. Cross-cutting workflows live under [`/company/workflows/`](../../company/workflows) with `module: company/runtime`.

### `trigger`

One of:

```yaml
trigger:
  kind: human         # operator-initiated from an admin surface
  actor: people:finance-lead
```
```yaml
trigger:
  kind: schedule
  schedule: "0 6 1 * *"
```
```yaml
trigger:
  kind: event
  event: runtime.incident_declared
```
```yaml
trigger:
  kind: webhook       # from an external integration
```
```yaml
trigger:
  kind: manual        # for development / dry-run only; not for production
```

### `hitl`

Boolean. When `true`, the entire workflow is human-led: at least one step must be `kind: human-approval`, and the workflow cannot have `trigger.kind: schedule` (the cross-document validator enforces this).

`hitl: true` is a strong signal to operators and to the runtime: this workflow makes irreversible changes and cannot fire on a clock.

---

## The `steps[]` block

Steps run in declared order unless a `branch` step redirects flow. Each step has:

- `id` — kebab-case, unique within the workflow
- `kind` — what kind of step (see table below)
- Optional: `dryRunRequired`, `hitl`, `onFailure`, `retries`, `timeout`, `emitsEvent`, plus kind-specific fields

### Step kinds

| `kind` | Purpose | Required fields |
|---|---|---|
| `agent` | Invoke a named agent | `agent: <name>` |
| `automation` | Invoke a named automation | `automation: <name>` |
| `human-approval` | Block until an approver records a decision | `approver: people:<role>` |
| `wait` | Sleep or poll for an external condition | (none — body defined by runtime) |
| `branch` | Conditional fork | `branches: [{when, next}]` |
| `emit-event` | Write a typed event to the ledger | `emitsEvent: <event-type>` |
| `external-call` | Call an integration directly (rare; prefer automation) | (none beyond integration reference) |
| `dry-run` | Compute a write's projected payload without mutation | `dryRunRequired: true` (convention) |
| `live-write` | The actual mutation | `automation: <name>`, `onFailure: …` |

### The canonical 5-step pattern

The sync verification protocol manifests in workflows as five typed steps:

```yaml
steps:
  - id: baseline
    kind: agent
    agent: <observer-agent>

  - id: dry-run
    kind: dry-run
    automation: <write-automation>
    dryRunRequired: true

  - id: approve
    kind: human-approval
    approver: people:<role>
    hitl: true

  - id: live-write
    kind: live-write
    automation: <write-automation>
    onFailure: escalate
    retries: 0
    emitsEvent: <state-change-event>

  - id: re-verify
    kind: agent
    agent: <observer-agent>
```

Every write path follows this shape. See [`month-end-close.yaml`](../../company/domains/finance-ops/finance/workflows/month-end-close.yaml) and [`customer-acquisition.yaml`](../../company/domains/sales-marketing/growth/workflows/customer-acquisition.yaml) for full instances.

### `onFailure` semantics

| Value | Behavior |
|---|---|
| `retry` | Retry per the step's `retries:` budget; escalate on exhaustion |
| `escalate` | Page the workflow's accountable contact; do not retry |
| `abort` | Halt the workflow; emit a typed `<workflow>.aborted` event |

For `live-write` steps, prefer `escalate` over `retry`. A live write that needs retry is usually a signal to investigate, not retry.

### `dryRunRequired: true`

Marks a step as requiring an earlier dry-run audit row under the same correlation ID. The runtime refuses to advance past a `live-write` step whose corresponding `dry-run` step did not produce an audit record.

---

## Inputs and outputs

```yaml
inputs:
  - name: period
    type: month
    required: true

outputs:
  - name: close-summary
    type: close-summary
```

Inputs are passed at trigger time (by the human operator, by the schedule, by the event payload). Outputs are produced by the workflow's final step and queryable by downstream consumers.

---

## Invariants

Same shape as other invariants — assertions about the workflow's behavior.

Almost every workflow declares:

- "First invocation of any new write path uses two dry-runs, not one."
- "Live-write step refuses without a captured human-approval row."
- "All steps emit an audit record under the workflow's correlation ID."

---

## Observability

```yaml
observability:
  dashboards:
    - finance-overview
  metrics:
    - METRIC-FIN-CLOSE-ON-TIME
```

`dashboards[]` references existing dashboards in [`/company/dashboards/`](../../company/dashboards). `metrics[]` references metrics in [`/company/metrics/`](../../company/metrics).

---

## Generated outputs for this workflow

After validation:

- Row in [`/generated/flow-registry.json`](../../generated/flow-registry.json) with the workflow's trigger, HITL flag, and step count
- Edges in [`/generated/dependency-graph.json`](../../generated/dependency-graph.json) if the workflow's steps cross module boundaries

---

## Common review failures

1. **`hitl: true` + `trigger.kind: schedule`** — rejected by the cross-document validator. Pick one: it's either human-gated, or it's scheduled. Never both.
2. **`live-write` step without a preceding `dry-run` step** — accepted by the schema, but the policy says dry-run first. Review should ask for the dry-run.
3. **`retries > 0` on a `live-write`** — almost always wrong. Retries for live writes mask the failure; escalation is the right response.
4. **Branch steps with overlapping `when` conditions** — the runtime picks the first match. Make `when` conditions mutually exclusive.
5. **Missing `emitsEvent` on a state-changing step** — the event ledger should record state transitions. If a `live-write` step doesn't `emitsEvent`, the ledger is incomplete.
6. **Vendor names in `automation:` references** — automations are vendor-neutral. The automation name describes the operation, not the system.

---

## Related

- Skill: [`sync-verification`](../../company/skills/sync-verification.yaml)
- Policy: [`/company/policies/hitl-external-writes.md`](../../company/policies/hitl-external-writes.md)
- Standard: [`/docs/standards/merge-policy.md`](../standards/merge-policy.md)
