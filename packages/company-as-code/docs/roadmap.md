# Roadmap

What's in the framework today, what's coming, and what's intentionally NOT in scope. The roadmap is the project's commitment to **declared scope**: when something here moves to "shipped", we ship; when something stays in "considered", forks know not to wait.

This file is updated through PRs like any other artefact. Disagreements about scope go through an ADR.

> **Snapshot date:** 2026-05-13 (post-PR #3 / pre-PR #4)

---

## Shipped (in main)

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

### PR #4 — Schema completeness for runtime primitives
- JSON Schemas for `Dashboard`, `Automation`, `EventTypeRegistry`, `AutonomyPolicy`, `EscalationPolicy`.
- Cross-document discipline checks: automations that mutate state must declare `dryRun` input; dashboard alert routing must resolve in escalation-policy; workflow/agent `emitsEvent` must reference a type in the registry; AutonomyPolicy and EscalationPolicy are singletons.
- This roadmap document.

After PR #4 lands, **every YAML in `/company/**` is machine-validated** — there are no more illustrative-only documents.

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

### A "marketplace" / public registry of forks, modules, skills
Belongs to community growth, not v1. May happen if adoption signals warrant it.

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
