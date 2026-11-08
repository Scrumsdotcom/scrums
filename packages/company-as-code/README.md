<div align="center">

# Company-as-Code

**An open-source operating system for AI-native organizations.**

Run your company like software: observable, versioned, orchestrated, automatable, continuously improving.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Status: Seed](https://img.shields.io/badge/status-seed-orange.svg)](#project-status)
[![CI](https://img.shields.io/badge/CI-validate%20%2B%20drift%20gate-success.svg)](./.github/workflows/validate.yml)

[Concepts](#core-concepts) ·
[Architecture](./docs/architecture.md) ·
[Getting Started](./docs/getting-started.md) ·
[Adoption](./docs/adoption.md) ·
[Anatomy](./docs/anatomy) ·
[Compliance](./docs/compliance.md) ·
[Capabilities](./docs/capabilities.md) ·
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

- **executable systems**: operations run from declarations, not from heroics
- **observable systems**: every action emits logs, events, traces, metrics
- **orchestrated systems**: humans and agents operate on the same runtime
- **AI-native systems**: agents are first-class citizens with scoped memory, tools, and authority
- **continuously improving systems**: retrospectives and bottleneck analysis are runtime primitives, not afterthoughts

What the repository holds is an **executable organizational graph**, an **AI-native operational runtime**, a **coordination layer** for humans and agents, and **infrastructure** for modern companies. Project management software tracks work items; this describes the system that produces them.

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

The folder structure represents **operational authority**, **execution responsibility**, **information boundaries**, **delegated cognition**, and **runtime orchestration**, not payroll hierarchy. See [`docs/architecture.md`](./docs/architecture.md) for the full canonical structure.

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
| **Task** | unit of execution, canonical state machine |
| **Workflow** | orchestration, multi-step execution |
| **Agent** | autonomous execution unit (AI or automation) |
| **Event** | state transition in the typed ledger |
| **Metric** | observable quantity with lineage and freshness |
| **Skill** | reusable Tier-3 technique; one canonical YAML, generated per runtime |
| **Capability** | something the company must be able to do, with an ordered chain of who does it when the owner cannot |
| **Requirement** | an obligation: a certification clause, a regulation article, a contract, a self-imposed rule |
| **Control** | the verified mechanism that keeps a Requirement true, and the evidence it produces |
| **Proposal** | the mutation queue for the conserved core, with a ruling quoted verbatim |

Schemas live in [`/schemas`](./schemas) and are enforced by CI.

### The company is a single canonical state machine

Company-as-Code is a **distributed orchestration system**. The substrate structures the company as canonical, queryable entities synchronizing state across unreliable nodes (humans, agents, and SaaS tools) under finite energy and attention constraints. The architecture treats the company as the same class of system as a biological organism, a software runtime, or a functioning civilization: distributed actors trying to reduce entropy by keeping shared state coherent, while operating with bounded compute, bounded memory, and lossy communication. This is not metaphor. It is the operating substrate.

Every entity in the system (service line, org, talent, agent run, deal, contract, task) has a canonical identifier, a canonical state, and a place in a **three-level state ladder**:

| Level | Name | Cardinality | Purpose |
|---|---|---|---|
| **L1** | Universal lifecycle bucket | 4 values: `pending` / `active` / `resolved` / `terminated` | The company's working set. Same enum for every entity, every domain. |
| **L2** | Domain-native journey stage | Per entity type | The recognizable journey for the entity (e.g. deal: `lead → qualified → proposal → won`). |
| **L3** | Operational substate | Per L2 stage | The fine-grained operational reality (e.g. `proposal.awaiting-legal-review`). |

The L1 layer functions as a **garbage collector for reality**: it defines the company's working set.

- Anything in `pending` or `active` is reachable and competes for attention.
- Anything in `resolved` or `terminated` is archived and no longer load-bearing on working memory.

This makes **"what is the company doing right now?"** a single deterministic query across every domain. Stuck-pending entities, terminal failure modes, and orphaned active entities become detectable generically, the same way a runtime detects unreachable objects or a cell detects misfolded proteins.

Workflows, agents, dashboards, and humans all read from this single substrate. Every system mutation flows **downward** from the canonical layer to projections (CRM, work management, finance, PSA, and other SaaS tools); state never originates downstream. The discipline is uniform:

- every entity declares its full state ladder
- every state declares its L1 bucket
- entities without canonical state and bucket assignment **do not exist in the substrate**

The result is a company that can be reasoned about, swept, queried, and operated on the same primitives as any well-designed distributed system, because that is what it is.

---

## The discipline

These are the rules that make Company-as-Code work in practice. Schema, generators, and CI enforce them; convention does not.

- **Modular monolith discipline.** Each module owns its logic. Cross-module talk goes through declared interfaces. No imports from another module's internals.
- **Module manifests.** Every module has a `manifest.yaml` declaring what it `owns`, `consumes`, `exposes`, and the agents and invariants attached to it. No code without a manifest.
- **Generated registries.** Manifests are walked by deterministic generators that emit an agent catalogue, flow registry, dependency graph, and per-agent context bundles. CI fails if generated files drift from sources.
- **Canonical IDs forever.** Internal IDs are permanent. External system IDs are evolutionary mappings. Vendor swaps don't touch your domain model.
- **Coordinate, don't replicate.** The coordination layer holds canonical IDs, state machines, and orchestration metadata, not a copy of every SaaS database.
- **One writer per field.** Mutation flow is unidirectional. Bidirectional sync is a defect, not a feature.
- **Dry-run is mandatory.** Every write path supports `dryRun=true` and uses it by default on first invocations.
- **HITL is declarative.** "Human-in-the-loop" is a declared invariant on the manifest, enforced by the runtime, not a comment in prose.
- **Audit log + typed event ledger.** Two distinct surfaces: what we did (audit) vs. what happened to the entity (typed events).
- **Sync verification protocol.** Baseline → dry-run → confirm counts → live → re-verify. Every state-mutating sync, the same five steps.
- **Plan-first, park-friendly.** Non-trivial work begins with a written plan that survives context loss. Resume from the plan, not from memory.
- **Verify before trust.** Recalled context is a claim until verified against current state.
- **Every reference is typed.** Reference fields declare the primitive kind they point at, so the whole corpus is one traversable graph and a dangling reference fails the build.
- **Obligations fail the build, not the audit.** An in-scope Requirement with no operating Control is a CI failure.
- **Fallback chains terminate in something that cannot be absent.** Never in an agent.
- **The conserved core changes through a ruling.** Spec, standards, schemas, and policies move via a Proposal with the decider's words quoted verbatim.
- **Write paths are built for interruption.** Deterministic references, evidence stamped into the target system, recovery by re-running.

Each of these is expanded in [`docs/architecture.md`](./docs/architecture.md) and codified as enforceable rules in [`docs/standards`](./docs/standards).

---

## Repository layout

```
/                                # root: README, LICENSE, CONTRIBUTING, CHANGELOG
├── /company                     # the organization itself, as code
│   ├── /executive               # CEO + domain-level cognition
│   ├── /domains
│   │   ├── /finance-ops
│   │   ├── /product-operations
│   │   └── /sales-marketing
│   ├── /initiatives             # strategic programs
│   ├── /goals                   # KPIs / OKRs / SLAs
│   ├── /metrics                 # typed metric definitions
│   ├── /capabilities            # what the company must be able to do, and who does it when the owner cannot
│   ├── /tasks                   # canonical task state machines
│   ├── /workflows               # orchestration definitions
│   ├── /agents                  # autonomous units
│   ├── /runtime                 # execution surface, autonomy classifications
│   ├── /events                  # typed event ledger schema
│   ├── /observability           # logs / traces / alerts wiring
│   ├── /dashboards              # executive, operational, agent dashboards
│   ├── /playbooks               # runbooks, SOPs
│   ├── /policies                # invariants, HITL declarations, security posture
│   ├── /requirements            # obligations: certification clauses, regulations, contracts
│   ├── /controls                # the verified mechanisms that keep them true
│   ├── /proposals               # the mutation queue for the conserved core
│   ├── /schemas                 # domain entity schemas
│   ├── /memory                  # persistent agent memory layer
│   ├── /prompts                 # versioned prompt templates
│   ├── /automations             # non-agent workflow automations
│   ├── /integrations            # external-system mappings (vendor-agnostic)
│   └── /templates               # starting points for new artefacts
├── /schemas                     # JSON Schemas for every canonical primitive
├── /templates                   # authoring templates (manifests, agents, etc.)
├── /cli                         # TypeScript reference CLI: validate + generate
├── /conformance                 # cases any implementation can run to prove it validates the same way
├── /docs                        # architecture, getting-started, standards, ADRs
├── /.github                     # CI workflows, PR templates, drift gates
├── /generated                   # committed generator outputs (do not hand-edit)
├── cac.yaml                     # what this tree is: upstream or a fork, and which framework release
└── framework.lock.json          # a hash of every framework file, so upgrades know what changed
```

Every path belongs to one of four classes: **framework** (shipped by upstream, replaced on upgrade), **adapt** (shipped as a starting point, then yours), **instance** (yours, never touched by an upgrade), and **derived** (regenerated). `company/` is instance; `schemas/`, `cli/`, `runtime/`, `templates/`, and `docs/` are framework. `npm run boundary` checks the line, and [`docs/standards/framework-boundary.md`](./docs/standards/framework-boundary.md) explains it.

---

## Quick start

```bash
# 1. Clone and install the reference CLI
git clone https://github.com/gez-scrumsdotcom/Company-as-Code.git
cd Company-as-Code
npm install --prefix cli

# 2. Validate every document, and resolve every typed reference
npm run validate

# 3. Run the generators (idempotent)
npm run generate

# 4. Check for drift (CI runs the same command)
npm run generate:check

# 5. Standing health inspection: rotted links, stale controls,
#    unwatched autonomous agents, modules with nobody accountable
npm run doctor

# 6. Check the framework/instance boundary (CI runs this too)
npm run boundary
```

Running your own company on it? Fork, then declare the fork and take upstream
releases with the CLI instead of a merge:

```bash
cd cli
npx tsx src/index.ts init --name "Acme" --namespace acme --write
npx tsx src/index.ts upgrade --from ../path/to/new-release      # dry run
npx tsx src/index.ts migrate                                    # dry run
```

See [`docs/forking.md`](./docs/forking.md), [`docs/upgrading.md`](./docs/upgrading.md),
and [`docs/importing.md`](./docs/importing.md) for drafting people and teams
from an existing org chart.

New to the pattern? [`docs/adoption.md`](./docs/adoption.md) is the honest
version of how to start: federate rather than migrate, and get one real
process running truthfully before scaffolding anything.

The CLI is one reference implementation. The framework is the specs in [`/schemas`](./schemas) and [`/docs`](./docs). Implement the generators in Go, Python, or Rust if you prefer.

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

- **Structured context bundles** are generated per agent, typed, scoped, deterministic. No raw-prose context.
- **Persistent agent memory** is a versioned layer distinct from documentation.
- **Autonomy classification** (`autonomous` / `human-gated` / `escalated`) is declared per action and enforced by the runtime.
- **Adversarial verification posture**: recalled information is a claim until checked against current state.
- **Three-tier knowledge model**: context (narrative), entry-points (runtime steps), skills (reusable techniques).
- **One skill primitive, every runtime.** Each Tier-3 skill is one YAML at [`/company/skills/`](./company/skills). The CLI generates per-runtime adapters: Claude `SKILL.md`, provider-neutral `AGENTS.md` for any tool that reads one, and Gemini Gem JSON. Forks add a fourth runtime in one small generator function.
- **No model names in canonical documents.** An agent declares `runtime: llm`. Which model serves that is a deployment decision made by the runtime host, not a fact recorded in the company's source of truth. Model names in canonical documents are the fastest way to build something that is stale within a quarter.

See [`docs/architecture.md#ai-native-design`](./docs/architecture.md) for the full picture.

---

## Interoperable by construction

- **Typed reference edges.** Every cross-document reference is annotated in the schema with the primitive kind it points at. One resolver checks all of them; a dangling reference fails the build. See [ADR-0007](./docs/adr/0007-typed-reference-edges.md).
- **A cyclic company graph.** [`/generated/company-graph.json`](./generated/company-graph.json) is derived from those annotations, so no edge list is hand-maintained. It is cyclic on purpose: a company is not a DAG, and forcing acyclicity means deleting real edges.
- **A JSON-LD context.** [`/generated/context.jsonld`](./generated/context.jsonld) maps the primitives onto schema.org, the W3C Organization ontology, PROV-O, OSCAL, and SKOS, so an external system can consume an export without a bespoke adapter.
- **Schema-driven SDKs.** TypeScript interfaces and Python `TypedDict`s, generated and drift-gated.

See [`docs/interoperability.md`](./docs/interoperability.md).

---

## Project status

**Current release:** `v0.6.0` (see [CHANGELOG](./CHANGELOG.md) for the full release history and [roadmap](./docs/roadmap.md) for what's next).

This is a **seed repository**. It ships:

- the complete canonical structure
- JSON Schemas for every primitive, with typed reference edges between them
- a working TypeScript CLI: validation, deterministic generators, drift gate, and a standing health inspection (`cac doctor`)
- a declared framework/instance boundary, with `cac upgrade` and `cac migrate` so forks can take releases
- a conformance suite, so a second implementation can show it reaches the same verdicts
- a document format that says how stable it is: `company-as-code/v1alpha1`
- a reference TypeScript **runtime host** that loads the manifest graph and executes workflows with audit + event persistence (SQLite or Postgres)
- a compliance layer where an uncovered obligation fails CI rather than surfacing at audit time
- CI workflows enforcing schema validity, unit tests, zero generator drift, blocking secret scanning, and dependency audit
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
5. **Standards live in the repo.** If you want to change a rule, change it in [`/docs/standards`](./docs/standards). CI will enforce the new version.

---

## Contributing, governance, support

| | |
|---|---|
| How to contribute | [`CONTRIBUTING.md`](./CONTRIBUTING.md) |
| Who decides what, and how it is recorded | [`GOVERNANCE.md`](./GOVERNANCE.md) |
| Who stewards the project, and what is promised | [`docs/governance/stewardship.md`](./docs/governance/stewardship.md) |
| Where each kind of question goes | [`SUPPORT.md`](./SUPPORT.md) |
| Reporting a vulnerability | [`SECURITY.md`](./SECURITY.md) |
| Community expectations | [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) |
| Maintainers | [`MAINTAINERS.md`](./MAINTAINERS.md) |

---

## License

[Apache License 2.0](./LICENSE). Fork, adapt, deploy, sell. Patent grant included.
Attributions for patterns adopted from neighbouring projects are in [`NOTICE`](./NOTICE).

---

## Author

Created, owned and maintained by **Gerald Neves** ([@gez-scrumsdotcom](https://github.com/gez-scrumsdotcom)).

[Scrums.com](https://scrums.com) runs an implementation of the Company-as-Code pattern.

The phrase "company as code" predates this project. Daniel Rothmann's essay is credited in [`NOTICE`](./NOTICE), and other, unrelated projects use the name. This repository is one framework for the idea.

---

<div align="center">

**Build companies the way you build software.**

</div>
