# /company

The organization, as code. This directory is the executable organizational graph, the source of truth for what the company owns, consumes, exposes, and executes.

## Structure

| Subdir | Purpose |
|---|---|
| [`/executive`](./executive) | CEO + domain-level cognition. The highest layer of the cognition tree. |
| [`/domains`](./domains) | Three canonical domains: finance-ops, product-operations, sales-marketing. |
| [`/initiatives`](./initiatives) | Strategic changes, time-bounded, decomposable, measurable. |
| [`/goals`](./goals) | KPI / OKR / SLA / metric targets. |
| [`/metrics`](./metrics) | Typed metric definitions with lineage, freshness, formula. |
| [`/capabilities`](./capabilities) | What the company must be able to do, and who does it when the owner cannot. |
| [`/tasks`](./tasks) | Canonical task state machines. |
| [`/workflows`](./workflows) | Cross-cutting orchestrations not owned by a single module. |
| [`/agents`](./agents) | Cross-cutting autonomous units (e.g. CEO agent, domain agents). |
| [`/runtime`](./runtime) | Execution surfaces, autonomy classifications, escalation policies. |
| [`/events`](./events) | Typed event ledger schema and topic registry. |
| [`/observability`](./observability) | Logs / traces / alerts wiring. |
| [`/dashboards`](./dashboards) | Executive, operational, agent dashboards. |
| [`/playbooks`](./playbooks) | Runbooks, SOPs, incident response. |
| [`/policies`](./policies) | Invariants, HITL declarations, security posture. |
| [`/requirements`](./requirements) | Obligations, certification clauses, regulation articles, contracts, self-imposed rules. |
| [`/controls`](./controls) | The verified mechanisms that keep Requirements true, and where their evidence lands. |
| [`/proposals`](./proposals) | The mutation queue for the conserved core. |
| [`/schemas`](./schemas) | Company-level domain entity schemas (your domain, not the framework). |
| [`/memory`](./memory) | Persistent agent memory namespaces. |
| [`/prompts`](./prompts) | Versioned prompt templates. |
| [`/automations`](./automations) | Non-agent automations. |
| [`/integrations`](./integrations) | External system mappings, vendor-agnostic, canonical-ID anchored. |
| [`/templates`](./templates) | Company-level starting points for new artefacts. |

## Discipline

- Every module under `/domains` carries a `manifest.yaml`. Folders without a manifest are organizational placeholders, valid signaling, no logic claim.
- Cross-module communication happens only through interfaces declared in the producer's manifest's `exposes` block.
- Generated registries in `/generated/` (at the repo root) flatten this graph into machine-readable views. Drift between manifests and generated views fails CI.
- Every cross-document reference resolves. Reference fields carry `x-cac-ref` in their schema; a reference pointing at nothing fails validation.
- Every in-scope Requirement is covered by an operating Control. An uncovered obligation fails the build rather than surfacing at audit time.
- Paths listed in [`.github/CODEOWNERS`](../.github/CODEOWNERS) are the conserved core. They change through a [Proposal](./proposals) carrying a ruling, not an ordinary edit.
