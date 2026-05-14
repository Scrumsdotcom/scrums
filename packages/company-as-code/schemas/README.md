# JSON Schemas

Framework-level JSON Schemas for every canonical Company-as-Code primitive. These define the *shape* of the operating system; they are not your company's domain. Company-level entity schemas live at [`/company/schemas`](../company/schemas).

CI validates every manifest, agent, workflow, task, and registry artefact against these schemas. Changes here are framework-breaking and require an ADR.

## Primitives

| Schema | Purpose |
|---|---|
| [`manifest.schema.json`](./manifest.schema.json) | Module manifest — identity, owns/consumes/exposes, agents, invariants, contacts |
| [`task.schema.json`](./task.schema.json) | Canonical task state machine — backlog / planned / active / blocked / review / completed / archived / failed |
| [`agent.schema.json`](./agent.schema.json) | Autonomous unit — runtime, schedule, cadence, autonomy classification, purpose |
| [`workflow.schema.json`](./workflow.schema.json) | Orchestration — steps, trigger, HITL declaration, dry-run requirement |
| [`initiative.schema.json`](./initiative.schema.json) | Strategic change — time-bounded, decomposable, measurable |
| [`goal.schema.json`](./goal.schema.json) | KPI / OKR / SLA / target with comparator and horizon |
| [`metric.schema.json`](./metric.schema.json) | Observable quantity — ownership, lineage, freshness, formula, thresholds |
| [`event.schema.json`](./event.schema.json) | Typed event ledger row — enum-typed, governed by registry |
| [`audit-record.schema.json`](./audit-record.schema.json) | Runtime action audit row — actor, action, payload, dryRun flag, status |
| [`interface.schema.json`](./interface.schema.json) | Declared module interface — operations, stability, dry-run support, HITL flags |
| [`organization.schema.json`](./organization.schema.json) | Canonical org unit — company, unit, team, pod |
| [`person.schema.json`](./person.schema.json) | Canonical actor — employee, contractor, supplier, AI operator, agent identity |
| [`integration.schema.json`](./integration.schema.json) | External system mapping — canonical IDs, mutation direction, HITL surfaces |
| [`skill.schema.json`](./skill.schema.json) | Tier-3 skill — composable reusable expertise; one canonical YAML, adapters emit Claude SKILL.md + AGENTS.md + Gemini Gem |
| [`dashboard.schema.json`](./dashboard.schema.json) | Read-only observability surface — panels, audience, refresh, alerts |
| [`automation.schema.json`](./automation.schema.json) | Deterministic execution unit — inputs (including `dryRun`), mutates, invariants, failure modes |
| [`event-type-registry.schema.json`](./event-type-registry.schema.json) | The enum-controlled registry of typed event names — one document for the company |
| [`autonomy-policy.schema.json`](./autonomy-policy.schema.json) | Runtime expression of the three autonomy classes + promotion path + preflight checks |
| [`escalation-policy.schema.json`](./escalation-policy.schema.json) | Severity SLAs, on-call role bindings, vendor-neutral channel routing |
| [`state-snapshot.schema.json`](./state-snapshot.schema.json) | Versioned checkpoint of canonical state — canonical entity IDs + evolving system mappings — for rollback to a known-good state |
| [`hub-module.schema.json`](./hub-module.schema.json) | CaC-Hub module metadata — a community-contributed, importable bundle of a validated payload (manifest, workflows, agents, policies) |
| [`shadow-enrollment.schema.json`](./shadow-enrollment.schema.json) | An agent's Shadow Mode enrollment plus accumulated Reliability Evidence — the basis for an automated promotion-to-autonomous ADR |

## Schema-driven SDKs

The schemas are the single source of truth, so the reference CLI projects them
into type-safe SDKs under [`/generated/sdk`](../generated/sdk) — TypeScript
interfaces and Python `TypedDict`s, one per schema. A "Company Agent" can be
written in any supported language and still type-check against the CaC spec.
`cac generate --check` gates SDK drift exactly like every other generated
artefact. See [`/generated/sdk/README.md`](../generated/sdk/README.md).

## Conventions

- Every primitive carries `apiVersion: company-as-code/v1` and a `kind` discriminator
- Canonical IDs are stable and prefixed (`TASK-…`, `INIT-…`, `GOAL-…`, `METRIC-…`, `ORG-…`, `PERSON-…`)
- External system IDs live under `externalIds` arrays — never as primary keys
- `additionalProperties: false` everywhere; new fields require a schema bump and an ADR
- Schema versions move forward only — deprecate, never silently remove
