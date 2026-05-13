# /company/dashboards

Dashboard definitions — executive, operational, workflow, initiative, agent, SLA. Each dashboard declares the metrics it surfaces and the audience it serves.

Dashboards are owned by a module. The catalogue here aggregates dashboard-id → module mappings for cross-cutting discovery.

## Contents

| File | Owner module | Audience |
|---|---|---|
| [`executive-overview.yaml`](./executive-overview.yaml) | `company/executive/ceo` | CEO, leadership |
| [`finance-overview.yaml`](./finance-overview.yaml) | `company/domains/finance-ops/finance` | CFO, finance-lead, CEO |
| [`platform-overview.yaml`](./platform-overview.yaml) | `company/domains/product-operations/platform` | platform-lead, CTO |

## Authoring

A dashboard declares: owner module, audience, refresh cadence, panels, and the alerts that observe the same metrics. Panels are typed (`stat`, `line`, `percentage`, `counter`, `list`, `markdown`, `composite`) and reference metric IDs from `/company/metrics/` or events from the typed event ledger.

Dashboards are **read surfaces only**. They never trigger writes. If you need a control surface, that's a workflow.

## Schema status

Dashboard YAMLs are illustrative — they are not yet schema-validated. A `Dashboard` schema is on the roadmap so dashboards can be machine-validated alongside other primitives. Track via a future ADR.
