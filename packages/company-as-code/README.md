<div align="center">

# Company-as-Code

**An open-source operating system for AI-native organizations.**

Run your company like software — observable, versioned, orchestrated, automatable, continuously improving.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Status: Seed](https://img.shields.io/badge/status-seed-orange.svg)](#project-status)
[![CI](https://img.shields.io/badge/CI-validate%20%2B%20drift%20gate-success.svg)](./.github/workflows/validate.yml)

[Concepts](#core-concepts) ·
[Architecture](./docs/architecture.md) ·
[Getting Started](./docs/getting-started.md) ·
[Anatomy](./docs/anatomy) ·
[Scenarios](./docs/scenarios) ·
[Forking](./docs/forking.md) ·
[Roadmap](./docs/roadmap.md) ·
[FAQ](./docs/faq.md) ·
[Standards](./docs/standards) ·
[Glossary](./docs/glossary.md)

</div>

---

## What this is

A company is a distributed system. Every organization already contains state, queues, workflows, events, retries, bottlenecks, orchestration, permissions, observability, incidents, throughput constraints, and runtime execution. Traditional organizations hide all of this inside meetings, inboxes, spreadsheets, undocumented processes, tribal knowledge, and disconnected SaaS tools.

**Company-as-Code externalizes them into the repository.** It transforms organizations into:

- **executable systems** — operations run from declarations, not from heroics
- **observable systems** — every action emits logs, events, traces, metrics
- **orchestrated systems** — humans and agents operate on the same runtime
- **AI-native systems** — agents are first-class citizens with scoped memory, tools, and authority
- **continuously improving systems** — retrospectives and bottleneck analysis are runtime primitives, not afterthoughts

This is not project management software. This is:

- an **executable organizational graph**
- an **AI-native operational runtime**
- a **coordination layer** for humans and agents
- **infrastructure** for modern companies

Think GitOps for organizations · Kubernetes for companies · Terraform for operations · DevOps for business execution.

---

## Who this is for

- **Startups** that want to scale without scaling meetings
- **Agencies** that need reproducible, observable delivery
- **SaaS businesses** and **marketplaces** with operationally complex flows
- **Consulting firms** that codify their operating model
- **AI-native companies** building human + agent workforces
- **Remote** and **hybrid** teams replacing tribal knowledge with declarations

If your company is a system, this is its source code.

---

## Core concepts

### The organization is three canonical domains

| Domain | Owns |
|---|---|
| **Finance & Ops** | finance, legal, people, suppliers, governance, operations, reporting, infra, internal systems, compliance |
| **Product & Operations** | products, engineering, delivery, web, platform, architecture, QA, reliability, security, documentation |
| **Sales & Marketing** | marketing, sales, customer success, partnerships, brand, growth, customer ops, revenue operations |

Subdomains, pods, temporary teams, initiatives, contractors, and autonomous agent units all compose underneath.

### The repository is an executable organizational graph

The folder structure represents **operational authority**, **execution responsibility**, **information boundaries**, **delegated cognition**, and **runtime orchestration** — not payroll hierarchy. See [`docs/architecture.md`](./docs/architecture.md) for the full canonical structure.

### Cognition is recursively composable

```
CEO Agent
├── Finance & Ops Agent
│   ├── Finance Agent
│   ├── Legal Agent
│   ├── People Agent
│   └── Governance Agent
├── Product & Operations Agent
│   ├── Platform Agent
│   ├── Delivery Agent
│   └── Reliability Agent
└── Sales & Marketing Agent
    ├── Growth Agent
    ├── Customer Agent
    └── Revenue Operations Agent
```

Every node has scoped memory, scoped tools, scoped workflows, scoped dashboards, scoped observability, scoped permissions.

### Everything is a typed primitive

| Primitive | Represents |
|---|---|
| **Organization** | company / unit / team / pod |
| **Person** | employee / contractor / supplier / agent identity |
| **Initiative** | strategic change with measurable outcome |
| **Goal** | KPI / OKR / SLA / metric objective |
| **Task** | unit of execution — canonical state machine |
| **Workflow** | orchestration, multi-step execution |
| **Agent** | autonomous execution unit (AI or automation) |
| **Event** | state transition in the typed ledger |
| **Metric** | observable quantity with lineage and freshness |
| **Skill** | reusable Tier-3 technique; one canonical YAML, generated per runtime (Claude, Gemini, Codex/AGENTS.md) |

Schemas live in [`/schemas`](./schemas) and are enforced by CI.

### The company is a single canonical state machine

Company-as-Code is a **distributed orchestration system**. The substrate structures the company as canonical, queryable entities synchronizing state across unreliable nodes — humans, agents, and SaaS tools — under finite energy and attention constraints. The architecture treats the company as the same class of system as a biological organism, a software runtime, or a functioning civilization: distributed actors trying to reduce entropy by keeping shared state coherent, while operating with bounded compute, bounded memory, and lossy communication. This is not metaphor — it is the operating substrate.

Every entity in the system — service line, org, talent, agent run, deal, contract, task — has a canonical identifier, a canonical state, and a place in a **three-level state ladder**:

| Level | Name | Cardinality | Purpose |
|---|---|---|---|
| **L1** | Universal lifecycle bucket | 4 values: `pending` / `active` / `resolved` / `terminated` | The company's working set. Same enum for every entity, every domain. |
| **L2** | Domain-native journey stage | Per entity type | The recognizable journey for the entity (e.g. deal: `lead → qualified → proposal → won`). |
| **L3** | Operational substate | Per L2 stage | The fine-grained operational reality (e.g. `proposal.awaiting-legal-review`). |

The L1 layer functions as a **garbage collector for reality**: it defines the company's working set.

- Anything in `pending` or `active` is reachable and competes for attention.
- Anything in `resolved` or `terminated` is archived and no longer load-bearing on working memory.

This makes **"what is the company doing right now?"** a single deterministic query across every domain. Stuck-pending entities, terminal failure modes, and orphaned active entities become detectable generically — the same way a runtime detects unreachable objects or a cell detects misfolded proteins.

Workflows, agents, dashboards, and humans all read from this single substrate. Every system mutation flows **downward** from the canonical layer to projections (CRM, work management, finance, PSA, and other SaaS tools); state never originates downstream. The discipline is uniform:

- every entity declares its full state ladder
- every state declares its L1 bucket
- entities without canonical state and bucket assignment **do not exist in the substrate**

The result is a company that can be reasoned about, swept, queried, and operated on the same primitives as any well-designed distributed system — because that is what it is.

---

## The discipline (the parts most frameworks skip)

These are the rules that make Company-as-Code work in practice. They're enforced by schema, generators, and CI — not by convention.

- **Modular monolith discipline.** Each module owns its logic. Cross-module talk goes through declared interfaces. No imports from another module's internals.
- **Module manifests.** Every module has a `manifest.yaml` declaring what it `owns`, `consumes`, `exposes`, and the agents and invariants attached to it. No code without a manifest.
- **Generated registries.** Manifests are walked by deterministic generators that emit an agent catalogue, flow registry, dependency graph, and per-agent context bundles. CI fails if generated files drift from sources.
- **Canonical IDs forever.** Internal IDs are permanent. External system IDs are evolutionary mappings. Vendor swaps don't touch your domain model.
- **Coordinate, don't replicate.** The coordination layer holds canonical IDs, state machines, and orchestration metadata — not a copy of every SaaS database.
- **One writer per field.** Mutation flow is unidirectional. Bidirectional sync is a defect, not a feature.
- **Dry-run is mandatory.** Every write path supports `dryRun=true` and uses it by default on first invocations.
- **HITL is declarative.** "Human-in-the-loop" is a declared invariant on the manifest, enforced by the runtime — not a comment in prose.
- **Audit log + typed event ledger.** Two distinct surfaces: what we did (audit) vs. what happened to the entity (typed events).
- **Sync verification protocol.** Baseline → dry-run → confirm counts → live → re-verify. Every state-mutating sync, the same five steps.
- **Plan-first, park-friendly.** Non-trivial work begins with a written plan that survives context loss. Resume from the plan, not from memory.
- **Verify before trust.** Recalled context is a claim until verified against current state.

Each of these is expanded in [`docs/architecture.md`](./docs/architecture.md) and codified as enforceable rules in [`docs/standards`](./docs/standards).

---

## Repository layout

```
/                                — root: README, LICENSE, CONTRIBUTING, CHANGELOG
├── /company                     — the organization itself, as code
│   ├── /executive               — CEO + domain-level cognition
│   ├── /domains
│   │   ├── /finance-ops
│   │   ├── /product-operations
│   │   └── /sales-marketing
│   ├── /initiatives             — strategic programs
│   ├── /goals                   — KPIs / OKRs / SLAs
│   ├── /metrics                 — typed metric definitions
│   ├── /tasks                   — canonical task state machines
│   ├── /workflows               — orchestration definitions
│   ├── /agents                  — autonomous units
│   ├── /runtime                 — execution surface, autonomy classifications
│   ├── /events                  — typed event ledger schema
│   ├── /observability           — logs / traces / alerts wiring
│   ├── /dashboards              — executive, operational, agent dashboards
│   ├── /playbooks               — runbooks, SOPs
│   ├── /policies                — invariants, HITL declarations, security posture
│   ├── /schemas                 — domain entity schemas
│   ├── /memory                  — persistent agent memory layer
│   ├── /prompts                 — versioned prompt templates
│   ├── /automations             — non-agent workflow automations
│   ├── /integrations            — external-system mappings (vendor-agnostic)
│   └── /templates               — starting points for new artefacts
├── /schemas                     — JSON Schemas for every canonical primitive
├── /templates                   — authoring templates (manifests, agents, etc.)
├── /cli                         — TypeScript reference CLI: validate + generate
├── /docs                        — architecture, getting-started, standards, ADRs
├── /.github                     — CI workflows, PR templates, drift gates
└── /generated                   — committed generator outputs (do not hand-edit)
```

The top-level `/schemas` and `/templates` are framework-level (define the shape). The `/company/schemas` and `/company/templates` are company-level (your domain entities and your in-house starting points). Forks should rarely touch the former.

---

## Quick start

```bash
# 1. Clone and install the reference CLI
git clone https://github.com/gez-scrumsdotcom/Company-as-Code.git
cd Company-as-Code
npm install --prefix cli

# 2. Validate every manifest, agent, workflow, and schema
npm run validate

# 3. Run the generators (idempotent)
npm run generate

# 4. Check for drift (CI runs the same command)
npm run generate:check
```

The CLI is one reference implementation. The framework is the specs in [`/schemas`](./schemas) and [`/docs`](./docs) — implement the generators in Go, Python, or Rust if you prefer.

See [`docs/getting-started.md`](./docs/getting-started.md) for a longer walkthrough including writing your first module manifest, declaring your first agent, and wiring your first workflow.

---

## Vendor neutrality

Company-as-Code **never** hardcodes:

- CRMs · workflow engines · databases · project management systems
- clouds · orchestration vendors · AI providers · communication platforms

Everything is **abstract, replaceable, interoperable**. Integrations live in [`/company/integrations`](./company/integrations) and resolve external systems through canonical IDs in the coordination layer. Replacing a vendor changes a mapping, not your domain model.

---

## AI-native by construction

The system is designed for AI participation from the ground up:

- **Structured context bundles** are generated per agent — typed, scoped, deterministic. No raw-prose context.
- **Persistent agent memory** is a versioned layer distinct from documentation.
- **Autonomy classification** (`autonomous` / `human-gated` / `escalated`) is declared per action and enforced by the runtime.
- **Adversarial verification posture** — recalled information is a claim until checked against current state.
- **Three-tier knowledge model** — context (narrative), entry-points (runtime steps), skills (reusable techniques).
- **One skill primitive, every runtime.** Each Tier-3 skill is one YAML at [`/company/skills/`](./company/skills). The CLI generates per-runtime adapters: Claude `SKILL.md`, provider-neutral `AGENTS.md` (Codex / Cursor / Aider / Continue), and Gemini Gem JSON. Forks add a fourth runtime in one small generator function.

See [`docs/architecture.md#ai-native-design`](./docs/architecture.md) for the full picture.

---

## Project status

**Current release:** `v0.1.0` — initial public seed. v0.2.0 and v0.3.0 work in flight (see [CHANGELOG](./CHANGELOG.md) and [roadmap](./docs/roadmap.md)).

This is a **seed repository**. It ships:

- the complete canonical structure
- JSON Schemas for every primitive
- a working TypeScript CLI with validation + generators
- a reference TypeScript **runtime host** that loads the manifest graph and executes workflows with audit + event persistence (SQLite or Postgres)
- CI workflows enforcing schema validity, unit tests, and zero generator drift
- worked examples across all three canonical domains
- documentation of the architecture, standards, and operating discipline

The runtime host is a **reference**, not the only runtime. Forks pick their own AI provider, integration clients, approval surface, and storage backend; the schemas guarantee that any implementation is portable. See [`/runtime/README.md`](./runtime/README.md).

---

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the contribution workflow. The short version:

1. **Plan first.** Non-trivial changes start with a plan in `/docs/plans/`.
2. **Declare before coding.** New modules ship their manifest in the same PR.
3. **Generators run on every PR.** Drift between sources and generated files fails CI.
4. **One writer per field.** If you're proposing a bidirectional sync, write the conflict-resolution protocol first.
5. **Standards live in the repo.** If you want to change a rule, change it in [`/docs/standards`](./docs/standards) — CI will enforce the new version.

---

## License

[Apache License 2.0](./LICENSE). Fork, adapt, deploy, sell. Patent grant included.

---

## Author

Created by **Gerald Neves**, Founder & CEO at [Scrums.com](https://scrums.com) — the all-in-one **Software Engineering Orchestration Platform (SEOP)**.

Company-as-Code is the open-source operating-system pattern behind SEOP's view of how modern, AI-native organizations should be designed, observed, and run.

---

<div align="center">

**Build companies the way you build software.**

</div>
