# Glossary

Canonical Company-as-Code terms. The spec at [`/docs/spec/company-as-code-spec.md`](./spec/company-as-code-spec.md) is the source of authority.

---

**Adversarial verification posture.** The discipline of treating any recalled information as a claim until verified against current state. Applies to agent memory, documentation, and prior conversation.

**Agent.** Autonomous execution unit. AI runtime, automation worker, or orchestration actor. Declares purpose, autonomy, cadence, runtime, schedule. Schema: [`/schemas/agent.schema.json`](../schemas/agent.schema.json).

**Audit log.** One row per orchestration action. Loose schema. Used for "what did we do" — debugging, post-hoc reasoning, compliance.

**Autonomy classification.** Per-action property declaring how the action fires: `autonomous`, `human-gated`, or `escalated`. Enforced by the runtime.

**Canonical ID.** Permanent internal identifier for an entity. Never changes for the lifetime of the entity. External system IDs live under `externalIds` mappings.

**Capability check.** A section of a plan that enumerates what has been verified about the systems involved. Evidence-based, not opinion.

**Cognition tree.** The recursively composable hierarchy of organizational cognition: CEO → domain executives → modules → sub-cognition.

**Context bundle.** Typed, scoped, deterministic runtime context generated per agent. Distinct from raw documentation; assembled from manifests + canonical inputs.

**Coordination layer.** The minimum state needed to orchestrate across systems: canonical IDs, system mappings, state machines, orchestration metadata. Not a copy of every SaaS database.

**Cross-document discipline check.** A validation that crosses primitive boundaries — e.g. workflow `hitl=true` cannot have `trigger.kind=schedule`. Implemented in the CLI's `validate` command.

**Drift gate.** CI job that runs the generators in check-only mode. If any generated file would change but isn't in the diff, the gate fails. Implemented as `npm run generate:check`.

**Dry-run.** Default first-invocation mode for any write path. Performs all validation, computes the full payload, writes an audit record, returns the payload — but mutates nothing external.

**Event ledger.** Typed, enum-controlled record of state transitions on canonical entities. Tight schema. Used for replay, derived state, agent reasoning. Distinct from the audit log.

**Executable organizational graph.** The repository structure as a runtime artifact. Maps operational authority, execution responsibility, information boundaries, delegated cognition. Not a payroll hierarchy.

**Generated registry.** Deterministic output of the manifest walker. Examples: agent-catalogue, flow-registry, dependency-graph, domain-model. Committed alongside sources.

**Goal.** Measurable objective — KPI, OKR, SLA, target, guardrail. References a metric. Owned, time-bounded. Schema: [`/schemas/goal.schema.json`](../schemas/goal.schema.json).

**HITL — Human-in-the-Loop.** A declared invariant requiring explicit human action. Lives on manifests, agents, and workflows. Enforced at runtime — schedules attached to HITL-declared workflows fail validation.

**Initiative.** Strategic change — time-bounded, decomposable, measurable. Rolls up into goals; decomposes into tasks. Schema: [`/schemas/initiative.schema.json`](../schemas/initiative.schema.json).

**Integration.** Mapping between the coordination layer and an external system. Pluggable. Declares canonical ID mapping, mutation direction, HITL surfaces. Schema: [`/schemas/integration.schema.json`](../schemas/integration.schema.json).

**Interface.** Named, declared contract a module exposes to other modules. Declared in the producer's `exposes` block; referenced from a consumer's `consumes` block. Schema: [`/schemas/interface.schema.json`](../schemas/interface.schema.json).

**Manifest.** The declarative source of truth for a module. Identity, owns, consumes, exposes, agents, invariants, contacts. Every module has one. Schema: [`/schemas/manifest.schema.json`](../schemas/manifest.schema.json).

**Memory.** Persistent agent layer holding collaboration patterns, parked epics, external system references, prior feedback. Distinct from documentation. Subject to adversarial verification.

**Metric.** Typed observable quantity with declared ownership, lineage, freshness, formula, thresholds. Schema: [`/schemas/metric.schema.json`](../schemas/metric.schema.json).

**Modular monolith discipline.** The set of rules that keep a single repository composable: module-owned logic, declared interfaces only, manifest-first, no business logic in infra, unidirectional mutation flow.

**Module.** A folder under `/company/**` carrying a `manifest.yaml`. A folder without a manifest is an organizational placeholder, not a module.

**Park-friendly plan.** A plan structured so it can be paused indefinitely and resumed without context loss. Includes a resume cue that lets a fresh operator start at the next concrete step.

**Person.** Canonical actor identity. Employee, contractor, supplier, AI operator, or agent identity. Schema: [`/schemas/person.schema.json`](../schemas/person.schema.json).

**Plan.** First-class artefact. Written before non-trivial work begins. Carries goal, solution shape, capability check, caveats, phasing, open questions, resume cue.

**Resume cue.** A sentence (or short paragraph) at the top of a plan describing exactly what a fresh operator needs to read to continue.

**Soft delete.** Mandatory deletion pattern. Records carry a tombstone with reason; never hard-deleted. Merges produce a "merged into" pointer.

**State ladder.** The three-level canonical state machine every entity in the substrate declares. **L1** = universal lifecycle bucket (`pending` / `active` / `resolved` / `terminated`), fixed by the framework. **L2** = domain-native journey stage, owned by the module. **L3** = operational substate under an L2 stage, owned by the module. Every L2 stage maps to exactly one L1 bucket; L3 inherits L1 from its L2 parent.

**Substrate.** The canonical state layer of Company-as-Code. Holds the state ladder, canonical IDs, and orchestration metadata for every operational entity. Mutation flows downward from the substrate to projections (CRM, work management, finance, PSA); state never originates downstream. Entities without canonical state and L1 bucket assignment do not exist in the substrate.

**Working set.** The reachable portion of the substrate — every entity with L1 in `pending` or `active`. Functions as the company's garbage-collected attention surface: `resolved` and `terminated` entities are archived and no longer load-bearing. Stuck-pending and orphaned-active detection are generic queries against the working set.

**Skill.** Tier-3 of the three-tier knowledge model: composable, reusable expertise referenced by name. One canonical YAML at `/company/skills/<name>.yaml`; the CLI generates per-runtime adapters (Claude `SKILL.md`, provider-neutral `AGENTS.md`, Gemini Gem JSON). Agents declare which skills they invoke via `skills:` on the agent manifest. Schema: [`/schemas/skill.schema.json`](../schemas/skill.schema.json).

**Sub-cognition.** Recursive module structure: a module may host child modules under `sub-cognition/<name>/`, each with its own manifest.

**Sync verification protocol.** Five-step protocol for state-mutating syncs: baseline → dry-run → confirm counts → live → re-verify. Same five steps every time.

**Task.** Canonical unit of execution. L2 state machine: `backlog | planned | active | blocked | review | completed | archived | failed`. L1 mapping: `backlog`/`planned` → `pending`; `active`/`blocked`/`review` → `active`; `completed` → `resolved`; `archived`/`failed` → `terminated`. Schema: [`/schemas/task.schema.json`](../schemas/task.schema.json).

**Three-tier knowledge model.** Documentation stratified into: Tier 1 Context (long-form narrative), Tier 2 Runtime Entry-Points (numbered steps with definition-of-done), Tier 3 Skills (composable reusable expertise).

**Tombstone.** A marker indicating a record was soft-deleted, with reason. Required for every deletion; hard-delete is forbidden.

**Typed event.** Event whose type comes from a controlled enum. New types require a schema migration. Distinct from free-text log entries.

**Workflow.** Multi-step orchestration. Triggered by event, schedule, human, webhook, or manual action. Steps may include dry-run, human-approval, live-write, branch, wait, emit-event. Schema: [`/schemas/workflow.schema.json`](../schemas/workflow.schema.json).

**Writeback.** A write from the coordination layer back to an external system. Typically HITL-gated. Always one-directional.
