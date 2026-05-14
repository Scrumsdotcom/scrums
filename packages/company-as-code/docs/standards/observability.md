# Standard: Observability

## Rule

Every agent, workflow, and integration emits to a declared audit topic, a typed event when it changes canonical state, and metrics that have ownership + freshness + lineage.

## What every new agent must declare

In its agent manifest:

- `observability.auditTopic` — where audit records land
- `observability.dashboards` — at least one dashboard surfacing this agent's run history
- `observability.alerts` — staleness / failure / threshold-breach alerts
- `outputs[].emitsEvent` — for any state-change-producing output, the typed event name

## What every new metric must declare

- `owner.module` — the module canonically responsible
- `lineage` — upstream sources, the field, and the transformation
- `freshness.expectedLag` and `freshness.maxLag` — past `maxLag`, alert
- `thresholds` — at minimum, a `warning` threshold

## Audit vs event ledger

Two surfaces, not interchangeable:

- **Audit log** answers *what did we do?* — every script run, every API call, every dry-run, every error
- **Typed event ledger** answers *what happened to this entity?* — enum-controlled, governed by a schema migration

Every mutation writes a typed event. Every action writes an audit row.

## Tracing joins the two ledgers

The audit log and the event ledger are deliberately separate — but a single operation touches both, and you need to see it as one story. That join is the **trace ID**.

- The reference runtime integrates OpenTelemetry natively: a root span per workflow execution, a child span per step.
- The span's W3C trace ID is stamped onto every audit row (`AuditRecord.traceId`) and every typed event (`Event.traceId`); the step's span ID lands on both too.
- `cac-host trace <traceId>` reads the join back out as one interleaved, time-ordered timeline.

Rule: every audit row and every typed event emitted inside an execution carries that execution's trace ID. Spans are real W3C IDs even with no exporter configured — exporting spans to a collector is optional; the IDs linking the ledgers are not.

## Forbidden

- Untyped event emissions ("free-text events are a code smell")
- Metrics without ownership
- Metrics without lineage
- Dashboards that nobody owns
