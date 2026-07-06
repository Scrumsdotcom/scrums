# Roadmap

What's in the framework today, what's coming, and what's intentionally NOT in scope. The roadmap is the project's commitment to **declared scope**: when something here moves to "shipped", we ship; when something stays in "considered", forks know not to wait.

This file is updated through PRs like any other artefact. Disagreements about scope go through an ADR.

> **Snapshot date:** 2026-07-02 (post v0.5.0, enforcement-gap pass in flight)

---

## Shipped (in main)

### v0.5.0 cycle — ecosystem & experience
- **CaC-Hub module registry** — `hub/modules/*` holds community-contributed, importable modules; each is a `HubModule` (new schema) wrapping a schema-valid `payload/`. `cac hub list / show / add / validate` browse and scaffold them; `cac hub add` is dry-run by default. The registry index `/generated/hub-index.json` is generated + drift-gated. Ships with `standard-hr` and `subscription-billing` example modules.
- **NL2M (Natural Language to Manifest)** — `cac nl2m "<prose>"` drafts a linked, schema-valid Initiative + Goal + Metric triple from a prose description. Deterministic heuristic parser (domain, direction, target, horizon, collision-free ID allocation), dry-run by default, honest `nl2m: review` markers on every inferred field. See `/docs/nl2m.md`.
- **Visual Cognition Graph** — `cac generate` emits `/generated/cognition-graph.json` (domains → modules → agents/workflows/metrics + dependency edges); `cac-host graph serve` renders it as an interactive graph overlaid with live audit/event/HITL activity read from the runtime DB. The click-through evolution of the Mermaid diagrams. See `/docs/cognition-graph.md`.
- **Shadow Mode for agents** — `cac-host shadow enroll <agent>` forces an agent into perpetual `dryRun: true` on every `execute`, recording each invocation as reliability evidence (`ShadowEnrollment` schema). `shadow status` evaluates the accumulated evidence against the AutonomyPolicy's `promotion.fromHumanGatedToAutonomous` bar; `shadow propose` drafts the promotion ADR once the gate clears. See `/docs/shadow-mode.md`.

### v0.4.0 cycle — schema-driven SDKs, tracing, snapshotting, HITL inbox
- **Schema-driven SDKs** — the reference CLI projects every JSON Schema into type-safe SDKs (`/generated/sdk/typescript`, `/generated/sdk/python`). A "Company Agent" can be written in any supported language and still type-check against the CaC spec. Drift-gated like every other generated artefact.
- **Native OpenTelemetry tracing** — the runtime opens a root span per workflow execution and a child span per step. The W3C trace ID is stamped onto both the audit log and the typed-event ledger; `cac-host trace <id>` reads the join back out as one interleaved timeline.
- **Versioned state snapshotting** — `cac-host snapshot create / list / show / rollback` checkpoints the entire canonical state (canonical IDs + system mappings) into a content-hashed row and atomically restores it. The append-only ledgers are never rewound; a rollback is itself an event.
- **Native HITL inbox + dashboard** — `--queue-approvals` routes `human-approval` steps through a durable inbox; humans resolve dry-run projections from the CLI or the `cac-host inbox serve` web dashboard, with their canonical Person ID recorded.
- New schema: `StateSnapshot`. New event types: `coordination.state_snapshot_created`, `coordination.state_rolled_back`. `AuditRecord` + `Event` gained `traceId` / `spanId`.

### v0.1.0 — initial seed
- Canonical specification, JSON Schemas for 13 primitives, `/company` scaffold, worked examples in finance / platform / growth, reference TypeScript CLI, CI workflows, architecture + standards + glossary + ADR-0001.

### v0.3.0 cycle (PR #4 + #5)
- **Schema completeness** — JSON Schemas for `Dashboard`, `Automation`, `EventTypeRegistry`, `AutonomyPolicy`, `EscalationPolicy`; every YAML in `/company/**` now schema-validates.
- **Reference runtime host** at [`/runtime`](../runtime) — TypeScript daemon-style CLI that loads the manifest graph, executes workflows (dry-run by default, opt-in `--live`), persists audit + event records.
- **Append-only sinks behind a common interface.** Reference backends ship for SQLite (zero-config) and Postgres (production); forks add Kafka / NATS / cloud-streaming by implementing the same two interfaces.
- **Execution-time invariants enforced by the runtime.** HITL workflow + scheduled trigger is refused. Live-write requires a prior dry-run audit row under the same correlation ID. emit-event rejects types absent from the registry.
- **Correlation-ID audit narratives.** Every audit row and typed event under a single execution shares a correlation ID; `cac-host audit <id>` prints the time-ordered narrative.

### v0.2.0 cycle (PR #2 + #3)
- **Skill primitive** (Tier-3 knowledge model) with cross-runtime adapters (Claude `SKILL.md`, AGENTS.md, Gemini Gem).
- **`AGENTS.md`** root navigation for any AGENTS.md-aware AI runtime.
- **Worked example in every previously-empty `/company/` folder** — policies, memory, prompts, events, runtime, dashboards, automations, playbooks, workflows, tasks.
- **Per-agent context-bundle generator** emitting `/generated/context-bundles/<module>__<agent>.json`.
- **`/docs/anatomy/`** field-by-field deep-dives on Manifest, Agent, Workflow.
- **`/docs/scenarios/`** three end-to-end walkthroughs (monthly close, growth experiment, cross-domain incident).
- **`/docs/forking.md`**, **`/docs/faq.md`**, **`MAINTAINERS.md`**.
- **ADRs 0002–0004** documenting modular monolith, unidirectional mutation, drift gate.
- **Mermaid diagrams** in architecture.md.

---

## In flight

### Enforcement-gap pass (declared rules become enforced rules)
- **Now:** fail-closed `kind:` validation, working branch execution in the runtime, event-schema ↔ registry pattern alignment, Python SDK required-field enforcement, strict CLI flag parsing, blocking secret scan, schema-valid authoring templates, CI typechecking, reconciled version story.
- **Next:** autonomy/HITL enforcement at execution time, the referential-integrity check suite (consumes→exposes, workflow step targets, `owns[]`, memoryScopes, dashboards), one-writer-per-field as a schema-representable and validated invariant, declared failure semantics (`onFailure`/`retries`/`timeout`), an installable repo-agnostic CLI.
- **Later:** the L1/L2/L3 state ladder encoded in schemas; typed context bundles, agent-attached skills, nested cognition graph, and an MCP entry point for the AI-native layer.

---

## Considered next (no committed timeline)

These are larger architectural additions, each a PR or a small sequence of PRs.

### Dynamic authorization (RBAC / ABAC)
> Map manifest-declared roles (`contacts`, `approver: people:x`, `escalation.to`) to actual execution permissions.

- Reference policy language candidates: **Casbin** (mature, polyglot), **OpenFGA** (relationship-based, cloud-native), or a minimal homegrown resolver matching the policy schema.
- Schema additions: `RoleBinding` (canonical Person ID ↔ role), `PermissionGrant` (role ↔ verb ↔ resource).
- Runtime: the runtime host calls into the authz resolver before any `human-approval` advances or any `live-write` fires.

### Integration controllers (Kubernetes-style)
> Move integrations from declarative YAMLs to a controller pattern: each `Integration` has a reconciler that handles the actual API handshakes.

- Pattern: Custom Resource Definition (CRD) shape — declared state, observed state, reconciliation loop, status reporting.
- Schema additions: `IntegrationController` (the reconciler's manifest), `IntegrationStatus` (the observed-state envelope).
- Initial reference controller: one full controller for an "example-crm" integration showing the reconciliation loop end-to-end.

---

## Considered later (or never)

### Additional skill runtime adapters
LangChain hub, custom IDE rules, Mistral, etc. The pattern is established in `cli/src/generate.ts`; adding adapters is small. Community-driven.

### A reference dashboard implementation
The framework specifies dashboard shape; rendering is out of scope. Forks pick Grafana / Datadog / homegrown.

### Multi-language CLI ports
The reference CLI is TypeScript. Go / Python / Rust ports would be welcome contributions but are not on the maintained roadmap.

### A hosted public registry of forks, modules, skills
Belongs to community growth, not v1. May happen if adoption signals warrant it.
Note: v0.5.0 shipped **CaC-Hub**, an *in-repo* module registry (`/hub/modules`,
`cac hub`). That is deliberately not this item — there is no hosted service, no
network fetch, no third-party publishing. [ADR-0005](./adr/0005-cac-hub-in-repo-registry.md)
records the distinction and the partial reversal.

### Visual workflow editor
The framework is declarative; visual editing is an interface concern. Out of scope.

### A managed hosted version
The Apache 2.0 license permits anyone to do this. The reference repo is opinionated infrastructure, not a SaaS.

---

## Explicit non-goals

These have been considered and explicitly declined. New PRs proposing any of these need an ADR overriding the decision.

- **Vendor-locked integrations.** No vendor name lives in canonical schemas. Period.
- **Replacing the spec with code.** The spec at `/docs/spec/company-as-code-spec.md` is authoritative; the code implements the spec.
- **Bidirectional sync as a default.** Unidirectional mutation flow is canonical ([ADR-0003](./adr/0003-unidirectional-mutation.md)).
- **Microservices-by-default deployment.** Modular monolith is the canonical structure ([ADR-0002](./adr/0002-modular-monolith.md)).
- **Hand-merging generated files.** Drift gate is canonical ([ADR-0004](./adr/0004-drift-gate.md)).

---

## How to propose a roadmap change

1. Open an ADR describing the proposed change. Cite which roadmap section it affects.
2. If the change moves an item from "considered" to "in flight", include the plan.
3. If the change moves an item from "considered later" to "considered next", include the rationale (adoption signal, technical readiness, ecosystem changes).
4. Reviewers consider the proposal against [ADR-0001](./adr/0001-record-architecture-decisions.md) and the explicit non-goals.
