# Company-as-Code: Master Specification

This document is the canonical specification for Company-as-Code.

It began as the seed prompt the repository was built from, and it now carries every decision that has been ratified since. It functions simultaneously as:

- the **master system prompt** for AI agents operating on this repository
- the **repo seed prompt** for forks and new instantiations
- the **README generation prompt** for derivative READMEs in subdomains
- the **architecture framing prompt** for module manifests and design docs
- the **agent scaffolding prompt** for declaring new autonomous units
- the **OSS positioning prompt** for external communication

Treat this file as the source of authority. When the architecture documents, code, or generated registries disagree with the spec, the spec wins until the spec is updated through a pull request.

When the spec changes, an ADR records the change. See [`/docs/adr`](../adr).

---

## SYSTEM PROMPT

You are designing and maintaining an open-source "Company-as-Code" operating system.

This project transforms companies into:

- executable systems
- observable systems
- orchestrated systems
- AI-native systems
- continuously improving systems

The goal is to create a reusable, forkable, extensible framework that allows any modern company to operate through:

- repositories
- workflows
- tasks
- agents
- observability
- event streams
- automation
- operational runtimes
- structured knowledge
- metrics
- dashboards
- AI orchestration

This framework should feel like:

- GitOps for organizations
- Kubernetes for companies
- Terraform for operations
- DevOps for business execution
- an operating system for AI-native organizations

The project should be:

- open-source
- composable
- extensible
- vendor agnostic
- API-first
- machine readable
- highly automatable
- deeply observable
- operationally opinionated

The framework must work for:

- startups
- agencies
- SaaS businesses
- marketplaces
- consulting firms
- AI-native companies
- operationally complex businesses
- remote teams
- hybrid organizations

The system must NEVER hardcode:

- CRMs
- workflow engines
- databases
- project management systems
- clouds
- orchestration vendors
- AI providers
- communication platforms

Everything must remain:

- abstract
- replaceable
- interoperable

---

## THE CORE INSIGHT

A company is a distributed system.

Every company already contains:

- state
- queues
- workflows
- events
- retries
- bottlenecks
- orchestration
- permissions
- observability
- incidents
- throughput constraints
- runtime execution

Traditional organizations hide these inside:

- meetings
- inboxes
- spreadsheets
- undocumented processes
- tribal knowledge
- disconnected SaaS tools

Company-as-Code externalizes them into:

- repositories
- schemas
- workflows
- event systems
- operational runtimes
- dashboards
- agents
- metrics
- playbooks
- automation

The company itself becomes:

- inspectable
- observable
- measurable
- versioned
- automatable
- reproducible
- improvable

---

## THE BREAKTHROUGH

Most operational systems model:

- tools
- tasks
- automations
- workflows

This system models:

- organizational cognition

The framework represents:

- strategic cognition
- operational cognition
- functional cognition
- execution cognition

The hierarchy enables:

- humans
- AI agents
- workflows
- observability
- approvals
- escalation
- planning
- accountability
- memory
- execution

to operate through the same organizational runtime.

This is NOT an org chart.

This is:

- an executable organizational graph
- a delegated cognition tree
- a scoped operational runtime
- a machine-readable operational system

---

## CANONICAL ORGANIZATIONAL MODEL

The organization is divided into three canonical domains.

### Finance & Ops

Responsible for:

- finance
- legal
- people
- suppliers
- governance
- operations
- reporting
- infrastructure
- internal systems
- compliance

### Product & Operations

Responsible for:

- products
- engineering
- delivery
- web
- platform
- architecture
- QA
- reliability
- security
- documentation
- product operations

### Sales & Marketing

Responsible for:

- marketing
- sales
- customer success
- partnerships
- brand
- growth
- customer operations
- revenue operations

The framework must support:

- subdomains
- pods
- temporary teams
- initiatives
- autonomous AI units
- contractors
- suppliers
- cross-functional execution

---

## EXECUTABLE ORGANIZATIONAL GRAPH

The repository structure represents:

- operational authority
- execution responsibility
- information boundaries
- delegated cognition
- runtime orchestration

NOT:

- payroll hierarchy
- HR reporting structure

The organizational hierarchy should map:

Strategic Scope
→ Operational Scope
→ Functional Scope
→ Execution Scope

---

## CANONICAL REPOSITORY STRUCTURE

```
/company
│
├── /executive
│   ├── /ceo
│   ├── /finance-ops
│   ├── /product-operations
│   └── /sales-marketing
│
├── /domains
│   │
│   ├── /finance-ops
│   │   ├── /finance
│   │   ├── /legal
│   │   ├── /people
│   │   ├── /suppliers
│   │   ├── /operations
│   │   ├── /governance
│   │   ├── /infra
│   │   └── /reporting
│   │
│   ├── /product-operations
│   │   ├── /web
│   │   ├── /products
│   │   ├── /platform
│   │   ├── /delivery
│   │   ├── /architecture
│   │   ├── /security
│   │   ├── /qa
│   │   ├── /reliability
│   │   └── /documentation
│   │
│   └── /sales-marketing
│       ├── /marketing
│       ├── /sales
│       ├── /customer
│       ├── /partnerships
│       ├── /growth
│       ├── /brand
│       ├── /content
│       └── /revenue-operations
│
├── /initiatives
├── /goals
├── /metrics
├── /capabilities
├── /tasks
├── /workflows
├── /agents
├── /runtime
├── /events
├── /observability
├── /dashboards
├── /playbooks
├── /policies
├── /requirements
├── /controls
├── /proposals
├── /decisions
├── /schemas
├── /memory
├── /prompts
├── /automations
├── /integrations
└── /templates
```

### The framework around the company

`/company` is the instance: the one part of the tree a company owns outright.
Everything around it is the framework, shipped by upstream and replaced on
upgrade. Two root files make that line checkable:

```
/cac.yaml                what this tree is: upstream or a fork, its namespace,
                         the framework release it is on, its declared deviations
/framework.lock.json     a hash of every framework file, published by upstream
/company                 the instance
/schemas /cli /runtime   the framework
/templates /docs /hub
/conformance
/generated               derived; regenerated, never edited
```

Every path belongs to exactly one class: **framework**, **adapt**,
**instance**, or **derived**. A fork edits `/company` freely, edits adapt files
knowingly, and changes a framework file only as a declared deviation. The
classes and the checks are in `docs/standards/framework-boundary.md`.

`/conformance` holds the cases that define a correct implementation. The
reference CLI is held to them like any other implementation; when the CLI and
a case disagree, the disagreement is resolved by changing one of them on
purpose, never by assuming the CLI is right.

---

## MODULAR MONOLITH DISCIPLINE

The repository follows a modular monolith pattern. The discipline is what makes the framework work, without it the structure collapses into either a microservice tangle or an undifferentiated mass.

### Hard rules

1. Each module owns its business logic, data access, agents, and invariants. Never move business logic out of the module that owns it.
2. Cross-module communication happens only through declared interfaces. Never import directly from another module's internals.
3. Every new module requires a manifest before any code is written.
4. Infrastructure layers contain zero business logic. They provide mechanisms, never rules.
5. State mutation is unidirectional. All state changes originate from the coordination layer downward; downstream systems read.

### Before adding anything new, answer

- Does this module have a manifest?
- Is the dependency you're adding declared in the manifest's consumes block?
- Does this logic belong here, or does it already exist in another module?
- If multiple modules want to share logic, does it belong in an infrastructure layer, or should it be lifted to a parent domain?

### What this prevents

- Tight coupling that makes modules impossible to extract or replace
- Hidden business rules scattered across infrastructure code
- Silent ownership drift, where multiple modules claim the same data
- Cross-module imports that turn the repo into spaghetti

---

## MODULE MANIFEST PATTERN

Every module (at every level of the organizational graph) has a manifest file at its root. The manifest is the single declarative source of truth for what the module owns and consumes.

### The manifest declares

- **module identity**: name, domain, version, lifecycle status (planning / hardening / stable / agent-ready / deprecated)
- **owns**: the tables, agents, apps, workflows, dashboards, schemas, and policies the module is canonically responsible for
- **consumes**: the named interfaces from other modules this module reads from
- **exposes**: the named interfaces this module offers to others
- **agents**: every autonomous unit declared here, with runtime, schedule, cadence, purpose, primary users, and outputs
- **invariants**: declarative properties that must remain true (e.g., "no autonomous writeback to external systems")
- **contacts**: humans accountable for the module

### Why declarative manifests

- The manifest is the contract; the code implements the contract
- Manifests are machine-readable, so generators, validators, and agents can reason about the whole organization without parsing prose
- Cross-module coupling becomes visible: if a module's consumes block doesn't reference an interface, importing from that module is a violation
- Manifests survive refactors and personnel changes; they are how organizational knowledge persists in version control
- Manifest changes are diffable, reviewable, and gated. The act of declaring is the act of agreeing

### Manifest rules

- No code without a manifest
- No interface without a declaration
- No agent without a purpose statement
- No consumes entry without a corresponding exposes entry on the other side
- Manifests are committed; CI rejects code that references undeclared interfaces or agents

---

## GENERATED REGISTRIES + DRIFT GATES

Manifests are walked by generators that emit aggregated indexes, registries that flatten the whole organizational graph into machine-readable views.

### What gets generated

- a **flow registry**, every workflow, agent, app, and runtime artefact across all modules, with its owner module, schedule, and cadence
- an **agent catalogue**, every autonomous unit across the organization, with capabilities and scopes
- **per-agent context bundles**: fully-resolved runtime context for each agent, derived from manifests + canonical inputs (see structured context bundles)
- a **domain model**, entity definitions, relationships, and the modules that own each entity
- a **dependency graph**, which module consumes which interface from which other module

### How generation works

- Generators are deterministic: given the same inputs they produce identical outputs
- Generated files are committed alongside their sources, so a clone of the repo carries the resolved view
- Every generated file is suffixed unambiguously so humans never confuse them with hand-authored files
- Generators are invoked through a single CLI entry point so contributors don't memorize ad-hoc commands

### CI drift gate

- CI runs the generators in check-only mode on every pull request
- If any generated file would change but isn't in the diff, CI fails
- This guarantees that source declarations and generated views never diverge silently

### Generated artifacts are never hand-merged

- When two pull requests touch different module manifests, they may both regenerate the same master index, producing a mechanical merge conflict
- Hand-merging is forbidden: it almost always produces a state that's neither side's correct output
- Resolution: take either side of the conflict, re-run the generators, commit the deterministic result
- This rule belongs in the contributor docs because it surfaces routinely

---

## CANONICAL IDS + EVOLVING SYSTEM MAPPINGS

Inside the company, every entity carries a stable canonical ID. Outside the company, every system carries its own ID for the same entity. The framework separates these explicitly.

### The principle

- canonical IDs are permanent. They never change for the lifetime of the entity
- canonical IDs are issued by the coordination layer at the moment the entity becomes operationally real
- system mappings (the IDs assigned by external SaaS tools) are evolutionary. They appear, change, merge, get rotated, and disappear over time
- the coordination layer stores the mapping; downstream code never depends on a specific system's IDs

### Practical consequences

- when an external tool is replaced, only the mapping changes, canonical IDs survive
- when entities are merged (two customer records turn out to be the same company), canonical IDs are stable; the merge is recorded against them
- every audit, event, and metric is keyed by canonical ID, not by the external system's ID

### Soft delete and merge patterns

- records are never hard-deleted; they are soft-deleted with a tombstone and a reason
- records are never silently merged; merges produce a canonical "merged into" pointer
- downstream joins use views that filter to the active set, not the raw tables
- this preserves audit trails and allows merges to be reversed if discovered to be wrong

---

## DATA TOPOLOGY: COORDINATE, DON'T REPLICATE

The coordination layer is not a copy of every SaaS system. It is the minimum state needed to coordinate across systems plus the canonical IDs that anchor everything else.

### The rules

- authoritative data stays in the system that originates it
- the coordination layer holds canonical IDs, system mappings, state machines, and orchestration metadata
- fields that belong to a specific SaaS tool are read on demand or mirrored sparsely, never replicated wholesale
- if a field can be derived from authoritative sources, it is derived, not stored

### Why this matters

- full replication produces sync hell. Every write becomes a multi-system reconciliation problem
- the coordination layer's job is to coordinate, not to be a database
- the smaller the coordination layer, the easier it is to reason about, audit, and replace
- downstream consumers (dashboards, agents, public APIs) read from the coordination layer or, when needed, directly from the authoritative system

### Anti-pattern

- a "central database that mirrors everything". This turns into the single biggest source of drift in the organization, and within a year nobody trusts it

---

## UNIDIRECTIONAL MUTATION FLOW

Every field in the system has exactly one writer.

- one system mutates each field
- everything else reads
- writebacks from the coordination layer to external systems are explicit and gated
- circular sync (system A writes → system B writes back → system A writes again) is treated as a defect, not a feature

### How it shows up

- a sync from an external system into the coordination layer is one-directional; updates flow in
- a writeback from the coordination layer to an external system is one-directional and triggered by an explicit operational action (often a human approval. See HITL invariants)
- fields that need to round-trip require a clear protocol: which side wins, under what conditions, and how conflicts are detected

### Why

- unidirectional flows are reasonable to test and audit
- bidirectional flows are nearly impossible to debug when they go wrong
- most apparent bidirectional needs can be solved by splitting fields between the two systems. One owns the canonical value, the other owns a derived view

---

## COGNITION TREE MODEL

The system should support recursively composable organizational cognition.

Example:

```
CEO Agent
├── Finance & Ops Agent
├── Product & Operations Agent
└── Sales & Marketing Agent
```

Then:

```
Finance & Ops Agent
├── Finance Agent
├── Legal Agent
├── People Agent
├── Infra Agent
└── Governance Agent
```

Then:

```
Platform Agent
├── Identity Agent
├── Billing Agent
├── API Agent
├── Deployment Agent
└── Observability Agent
```

Every node should support:

- scoped memory
- scoped tools
- scoped workflows
- scoped dashboards
- scoped observability
- scoped permissions
- scoped tasks
- scoped automation
- scoped context windows

### Sub-domain placeholders are valid

- a folder can exist for organizational signaling without claiming runtime ownership
- not every sub-domain has a manifest, sub-domains without substantial logic remain organizational placeholders
- this lets the cognition tree grow organically: structure can be staked out before the work to populate it arrives
- the rule is: a folder without a manifest declares no logic; a folder with a manifest is a real module subject to the modular monolith discipline

---

## CANONICAL OPERATIONAL PRIMITIVES

### Organization

Represents:

- company
- business unit
- team
- pod
- department

### Person

Represents:

- employee
- contractor
- supplier
- AI operator
- agent identity

### Initiative

Represents:

- strategic change
- transformation
- migration
- upgrade
- priority program

Initiatives are:

- measurable
- observable
- decomposable
- time bounded

### Goal

Represents:

- KPI
- OKR
- SLA
- target
- metric objective

### Task

Represents:

- unit of execution
- workflow state
- operational action
- agent instruction
- approval gate

Tasks are canonical state machines.

Canonical states:

- backlog
- planned
- active
- blocked
- review
- completed
- archived
- failed

Tasks support:

- ownership
- dependencies
- automation hooks
- observability
- event history
- sub tasks
- escalation
- AI execution
- human approvals
- SLA tracking

### Workflow

Represents:

- orchestration
- automation
- multi-step execution
- operational procedures

### Agent

Represents:

- autonomous execution unit
- AI runtime
- automation worker
- orchestration actor

Agents can:

- observe
- reason
- plan
- execute
- escalate
- update state
- generate outputs
- trigger workflows

### Capability

Represents:

- something the company must be able to do
- the ordered chain of who does it
- how much of it survives each hop down that chain

A capability declares a primary owner, an ordered fallback chain, and a final
fallback that cannot itself be absent. Every holder declares what it delivers:
the whole capability, a documented subset, a manual version of the outcome, or
triage only.

An org chart records who owns what on a good day. A capability records what
happens on the other days.

### Requirement

Represents:

- a certification clause
- a regulation article
- a contractual commitment
- a rule the company imposes on itself

A requirement states what must be true. It never names the controls that make
it true.

### Control

Represents:

- the mechanism that keeps one or more requirements true
- how that mechanism is verified, on what cadence
- where the evidence it produces lands

Coverage is declared one way, by the control. Two lists that must agree will
eventually disagree; there is only one list.

### Proposal

Represents:

- a proposed change to the conserved core
- the evidence that forced it
- the ruling that accepted or rejected it

Writing a proposal is free and carries no authority. Applying one requires a
recorded ruling from a human, quoted verbatim.

---

## CANONICAL STATE LADDER (the substrate)

Company-as-Code is a distributed orchestration system. The substrate structures the company as canonical, queryable entities synchronizing state across unreliable nodes (humans, agents, and SaaS tools) under finite energy and attention constraints.

The architecture treats the company as the same class of system as a biological organism, a software runtime, or a functioning civilization: distributed actors trying to reduce entropy by keeping shared state coherent, while operating with bounded compute, bounded memory, and lossy communication.

This is not metaphor. It is the operating substrate.

### Every entity has the same ladder

Every entity in the system (service line, org, talent, agent run, deal, contract, task) has:

- a canonical identifier
- a canonical state
- a place in a three-level state ladder

### The three levels

- **L1, Universal lifecycle bucket.** One of: `pending`, `active`, `resolved`, `terminated`. The same enum for every entity, every domain. Framework-owned and fixed.
- **L2, Domain-native journey stage.** The recognizable per-entity journey (e.g. `lead → qualified → proposal → won` for a deal; `backlog → planned → active → review → completed` for a task). Module-owned.
- **L3, Operational substate.** Fine-grained operational reality under an L2 stage (e.g. `proposal.awaiting-legal-review`). Module-owned.

Every L2 stage declares the L1 bucket it belongs to. Every L3 substate inherits L1 from its L2 parent. An entity's L1 is a deterministic projection of its L2, never independently asserted.

### L1 is a garbage collector for reality

The L1 layer defines the company's **working set**:

- `pending` and `active` are reachable. These entities compete for attention.
- `resolved` and `terminated` are archived. These entities are no longer load-bearing on working memory.

This makes "what is the company doing right now?" a single deterministic query across every domain. It makes stuck-pending entities, terminal failure modes, and orphaned active entities detectable generically, the same way a runtime detects unreachable objects, or a cell detects misfolded proteins.

### Mutation flows downward

- Workflows, agents, dashboards, and humans all read from this single substrate.
- Every system mutation flows downward from the canonical layer to projections, CRM, work management, finance, PSA, and other SaaS tools.
- State never originates downstream.

### The discipline

- Every entity declares its full state ladder.
- Every state declares its L1 bucket.
- Entities without canonical state and bucket assignment do not exist in the substrate.
- L1 transitions emit typed events in the ledger.
- Recursive composability: the same three-level ladder applies at every level of the cognition tree. Modules, sub-modules, agent runs, sub-tasks. The ladder is universally derived, not domain-specific.

The result is a company that can be reasoned about, swept, queried, and operated on the same primitives as any well-designed distributed system, because that is what it is.

---

## OPERATIONAL RUNTIME MODEL

Humans and AI operate on the same runtime.

Everything emits:

- logs
- events
- traces
- metrics
- exceptions
- execution history

The runtime supports:

- human execution
- AI execution
- mixed execution
- approvals
- retries
- escalations
- exception handling
- automation chains

### Autonomy classification per action

Every executable action declares its autonomy classification.

- **autonomous**: fires without human intervention (typical for read-only syncs, dry-runs, validation, registry generation)
- **human-gated**: requires explicit human action to fire (typical for writebacks to external systems, irreversible changes, financial actions)
- **escalated**: fires autonomously up to a threshold, then escalates (typical for retries, error budgets, dunning sequences)

The classification is declarative in the manifest, not a comment in the code. The runtime enforces it.

---

## DRY-RUN AS A FIRST-CLASS INVARIANT

Every action that mutates state has a dry-run mode.

### The rule

- every write path accepts a `dryRun` argument
- when `dryRun` is true, the action performs all validation, computes the full payload it would send, writes a single audit record, and returns the payload, but mutates nothing external
- dry-run is the default for the first invocation of any new write path

### Why this matters

- the first time a write path runs in a real environment, you want to see exactly what it would do
- dry-run produces a reviewable diff between intended state and current state
- dry-run is auditable: future-you can grep the audit log for every dry-run that preceded the first live execution
- dry-run is the safety net that makes autonomous execution defensible

### Where it shows up

- in the runtime's standard arguments
- in the audit log's payload schema (every action records whether it was a dry-run)
- in the contributor checklist: "did you run dry-run first" is part of merge gates for new write paths

---

## HITL INVARIANTS AS DECLARATIONS

Human-in-the-loop is not a comment in documentation. It is a declared invariant on the module manifest, the agent declaration, and the workflow definition.

### How it works

- the manifest declares: "this writeback fires only from human action in this admin surface"
- the agent declaration declares: "cadence: on-demand; never scheduled"
- the runtime enforces the declaration, schedules attached to an HITL-declared workflow fail validation

### The principle

- humans are accountable for irreversible writes
- AI proposes, humans confirm
- the declaration is the source of truth, code that contradicts the declaration fails CI

### Common HITL patterns

- mark-active gates before any external write
- supersede / replace gates before any destructive write
- compliance / financial action gates with a recorded actor
- dry-run-then-live gates for first invocations of any write path

---

## AUDIT LOG + TYPED EVENT LEDGER

The runtime has two distinct logging surfaces. They are not interchangeable.

### Audit log

- one row per orchestration action (every script run, every API call, every dry-run, every error)
- records: actor, action, timestamp, input payload (redacted), output, status, duration
- used for: post-hoc reasoning about "what happened", debugging, compliance
- schema is loose enough to capture any action, structured enough to query

### Typed event ledger

- one row per state transition on a canonical entity
- events are typed via enums, not free text
- records: entity ID, event type (enum), payload, actor, timestamp
- used for: replay, derived state, dashboards, agent reasoning
- schema is tight: new event types require migrations + enum updates

### Why two

- the audit log is for the runtime ("what did we do")
- the event ledger is for the business state machine ("what happened to this entity")
- mixing them produces a table that's bad at both

### Discipline

- every state mutation writes a typed event
- every action writes an audit row
- nothing escapes both, if it's not in the audit log, it didn't happen; if it's not in the event ledger, the state didn't change

---

## SYNC VERIFICATION PROTOCOL

Every state-mutating sync follows the same five-step verification protocol, regardless of which systems are involved.

### The protocol

1. **Baseline.** Query current state. Record counts, IDs, hashes, whatever the sync would change.
2. **Dry-run.** Execute the sync with `dryRun=true`. Inspect the audit record's intended-write payload. Confirm it matches expectation.
3. **Confirm counts.** Compare the dry-run's projected delta to the baseline. If the number of rows touched is wildly different from expected, stop.
4. **Live.** Execute with `dryRun=false`. Begin with the smallest possible scope (one entity, one record).
5. **Re-verify.** Re-query the baseline. Confirm state shifted exactly as the dry-run predicted.

### Why a standard protocol

- every operator does it the same way, no improvisation
- mistakes are caught in step 3, not step 5
- the audit log naturally captures the sequence: baseline / dry-run / counts / live / re-verify becomes a queryable narrative
- it scales to AI operators: an agent following this protocol is auditable in the same way a human is

---

## OBSERVABILITY FRAMEWORK

The company must be observable like infrastructure.

Everything should emit:

- metrics
- events
- traces
- logs
- alerts

The framework should support:

- executive dashboards
- operational dashboards
- workflow dashboards
- initiative dashboards
- agent dashboards
- SLA dashboards

Metrics must support:

- ownership
- lineage
- freshness
- formulas
- thresholds
- source mappings
- alerting
- history

The observability layer should expose:

- bottlenecks
- operational health
- execution throughput
- blocked work
- SLA failures
- organizational risk
- workflow reliability
- business health

---

## CONTINUOUS IMPROVEMENT SYSTEM

Continuous improvement is a first-class runtime primitive.

Every workflow should support:

- retrospectives
- optimization
- bottleneck analysis
- automation opportunities
- AI recommendations
- execution review
- operational learning

The framework assumes:

- workflows evolve
- systems drift
- organizations degrade without feedback loops

The company should continuously improve itself.

---

## KNOWLEDGE SYSTEM

Documentation is executable infrastructure.

The framework should support:

- SOPs
- playbooks
- ADRs
- onboarding
- prompts
- runbooks
- architecture docs
- workflow specs
- operating standards

Documentation must connect to:

- workflows
- tasks
- metrics
- owners
- agents
- dashboards

---

## THREE-TIER KNOWLEDGE MODEL: CONTEXT vs ENTRY-POINTS vs SKILLS

Knowledge in the repository is stratified into three distinct tiers. They serve different audiences, tolerate different shapes, and have different update cadences.

### Tier 1: Context

- long-form narrative explaining why something exists, what it's for, how it came to be
- tolerates loose structure, prose, history, opinions
- lives in wiki-style documents and architectural ADRs
- read by humans onboarding, occasionally by agents needing background
- update cadence: rarely; long-lived

### Tier 2: Runtime entry-points

- numbered steps, inputs, outputs, definition-of-done
- lives in task descriptions, workflow definitions, and runbooks
- tolerates lossy formatting; the structure matters more than the styling
- read by humans and agents at execution time
- update cadence: frequently as workflows evolve

### Tier 3: Skills

- composable, reusable expertise referenced by name
- lives in version-controlled skill definitions with metadata
- read by agents when invoked
- update cadence: when the technique itself changes, not when one instance changes

### The split matters because

- context is the wrong place for runtime steps, too much narrative, no contract
- runtime entry-points are the wrong place for context, too tight to carry history
- skills are the wrong place for either, they're reusable techniques, not specific instances

### Migration pattern

- legacy wiki dumps are full of mixed-tier content
- the migration pipeline classifies each document, extracts the runtime portion into entry-points, extracts the reusable technique into skills, leaves the residual narrative as context
- once migrated, the original wiki entry is archived; the three-tier model becomes the operational surface

---

## STANDARDS AS CODIFIABLE DOCUMENTS

Engineering and operational standards live in the repository, not in external wikis. They are versioned, reviewable, and enforceable.

### What gets codified

- code organization rules, where logic lives, where runtime config lives
- schema migration conventions, naming, ordering, applied-vs-pending tracking
- branch naming and commit hygiene
- merge and conflict-resolution rules, especially for generated files
- security posture, force-push policy, secret handling, dependency review
- observability requirements, what every new agent must emit
- documentation requirements, what every new module must declare

### Why this beats wiki standards

- standards in the repo are diffable; changes are reviewable
- CI can enforce them: a violation becomes a build failure, not a code-review comment
- contributors discover them while reading the repo, not by searching elsewhere
- they evolve via PR, which means proposed changes get discussion before adoption

### The rule

- if a standard is worth enforcing, it lives in the repo
- a rule that is not in the repo is a preference

---

## PLAN-FIRST, PARK-FRIENDLY WORKFLOW

Non-trivial work begins with a plan. Plans are first-class artefacts.

### Why plans

- the act of writing a plan exposes gaps in understanding before they become bugs
- plans are reviewable by humans and agents
- plans survive context loss. A plan written today can be picked up next month, next quarter, or by another operator
- plans turn implicit work into explicit work

### Plan structure

- **status banner**: active, parked, blocked, in-flight, complete
- **goal**: one or two sentences
- **solution shape**: the intended architecture, with the boundaries it respects
- **capability check**: what's been verified about the systems involved
- **caveats**: known unknowns, locked-in design decisions, things not to re-debate
- **phasing**: explicit stages with effort estimates and gating conditions
- **open questions**: things parked until resumption
- **resume cue**: exactly what a fresh operator needs to read to continue

### Park-friendly

- a plan can be parked indefinitely without losing context
- the resume cue is the test: if a fresh operator can pick up the plan and start at the next concrete step, the plan is well-written
- parked plans live alongside the module they describe, not in a planning-tool silo
- the existence of a parked plan is itself a memory: "this work is acknowledged, scoped, and waiting"

### The discipline

- before non-trivial work, write the plan
- before parking work, finalize the plan so resumption is clean
- before resuming work, verify the plan against current state, systems may have evolved while it was parked

---

## AI-NATIVE DESIGN PRINCIPLES

This framework assumes:

- AI participates in operations
- AI coordinates work
- AI generates documentation
- AI executes workflows
- AI monitors systems
- AI identifies bottlenecks
- AI assists decision-making

The system should optimize for:

- structured context
- deterministic schemas
- machine readability
- composability
- modularity
- event-driven execution
- agent interoperability

---

## STRUCTURED CONTEXT BUNDLES FOR AGENTS

Agents read structured runtime context, not raw prose. Every agent gets a typed bundle assembled deterministically from manifests and canonical inputs.

### What a context bundle contains

- the agent's identity, purpose, and autonomy classification
- the entities and interfaces it has read access to
- the entities and interfaces it has write access to (with HITL constraints declared)
- the schemas of every data structure it operates on
- the runtime tools available to it
- the canonical events it can emit
- the dashboards and audit surfaces that observe it

### Why bundles, not raw documents

- raw documents have variable structure, drift over time, and require interpretation
- bundles are deterministic. The same manifest inputs produce the same bundle
- bundles are typed. Schemas are explicit, not inferred from prose
- bundles are scoped. An agent only sees what it needs, reducing context-window pressure and information leakage

### Generation pipeline

- manifests declare what agents exist and what they own / consume
- canonical inputs (domain model, interface registry, event schemas) provide shared definitions
- the generator walks these and emits one bundle per agent, committed alongside the agent definition
- CI verifies bundles are up to date: drift between manifest and bundle is a build failure

### The principle

- the context-bundle pipeline is to AI runtimes what the build system is to compiled software
- changes to manifests trigger regeneration; nothing manual; nothing lossy

---

## PERSISTENT AGENT MEMORY

Agents have a memory layer that persists across conversations and sessions. Memory is distinct from documentation.

### What memory is for

- user and collaboration patterns ("this operator prefers terse responses", "verify dry-run before live")
- architecture decisions that don't yet warrant a permanent doc
- parked epics and their resume cues
- references to external systems and where to find what
- feedback received in past sessions that should shape future behavior

### What memory is NOT for

- code patterns, architecture, file paths. These can be derived from the current repo state
- git history, recent changes, version control is authoritative
- fix recipes for bugs that have been resolved. The fix is in the code; the commit has the context
- ephemeral task state. That lives in tasks, not memory

### Memory hygiene

- memories are atomic, one slug, one concept, one file
- memories carry frontmatter for type and discoverability
- an index file lists all memories with one-line hooks for fast scanning
- memories that are wrong or outdated are removed, not amended into incoherence
- a memory that names a specific file or symbol is a claim that it existed when the memory was written, agents verify before acting on memory recommendations

### Why this matters

- agents without persistent memory re-derive the same context every session
- memory makes long-running collaborations coherent across operators and time
- memory turns the agent from a fresh-context tool into a continuing collaborator
- the memory layer is to AI runtimes what onboarding documents are to human teammates, but versioned, structured, and continually maintained

---

## ADVERSARIAL VERIFICATION POSTURE

Agents and humans treat recalled information as a claim, not as ground truth. Verify before acting.

### The rule

- a memory, a document, or a prior answer is evidence of what was true at the moment it was written
- before recommending an action based on recalled information, verify against current state
- if the recalled claim conflicts with current observation, trust the observation and update the recalled claim

### Where it shows up

- memory recall: when a memory names a function or flag, verify it still exists before recommending it
- documentation: when an architecture doc describes a system, verify the system still works that way before acting on the doc
- state checks: before mutating, query the current state, don't assume the prior dry-run is still valid
- generated-file claims: before consuming a generated registry, verify it was regenerated recently, stale registries are wrong registries

### The principle

- the system optimizes for being correct over being fast
- a verification step costs a query; a wrong recommendation costs trust
- this posture is what makes autonomous execution defensible at scale

---

## COMPLIANCE AS CODE

Every operating framework describes how work gets done. Almost none describe
what the company is obliged to be able to prove. That gap is why a
certification audit costs hundreds of person-hours: the evidence exists,
scattered, and someone has to assemble it into a shape an auditor accepts.

### The model

- A **Requirement** states what must be true, and where the obligation comes from.
- A **Control** states how it is kept true, how it is verified, and where the evidence lands.
- The edge runs one way. Controls name Requirements; Requirements never name Controls.

### The gate

An in-scope Requirement with no operating Control fails validation. A gap
becomes a build failure rather than an audit finding.

Two explicit escape hatches exist: `planned` for an obligation the company
intends to meet but has not yet, and `out-of-scope` with a required written
rationale. A silent exclusion is the thing auditors look for first.

### Verification is the load-bearing field

A control nobody checks is a claim. Every control declares a verification
method, a surface, and a cadence, and an automated control must point at
something a machine actually runs. The generated matrix distinguishes
machine-verified coverage from human promises rather than averaging them into
a percentage.

### Staleness is a separate question from coverage

Validation asks whether coverage exists. The standing health inspection asks
whether it is still real. A control whose last verification has fallen far
behind the rest of the repository is either not running or unobserved, and
those two states are indistinguishable from outside.

---

## CAPABILITY AND THE FALLBACK CHAIN

Ownership answers the question on a good day. A capability answers it on the
day the owner is unreachable, the agent's credentials expired, or the person
who knew how to run the process left three weeks ago.

### The chain

Every capability declares a primary owner, an ordered fallback chain, and a
final fallback. Each link declares what it delivers: the whole thing, a
documented subset, a manual version of the outcome, or triage only.

### The rules

- The chain terminates in a holder that cannot itself be absent. The final
  fallback is never an agent.
- A holder may not appear twice in one chain. A repeated holder is not a
  fallback, it just looks like one.
- High and critical capabilities carry at least one intermediate fallback.
- A critical capability may not terminate in a triage-only holder, because
  nobody closes the loop.

### Why the honesty field matters

A chain whose links all claim to deliver the whole capability, when two of them
cannot actually approve anything, is worse than no chain. It will be believed
during an incident. The declared degradation is the part that makes the
document useful rather than reassuring.

---

## THE CONSERVED CORE

Most of the repository is free. A small part is conserved, and changing it goes
through a Proposal with a recorded ruling.

The split preserves **governance latency**: layers that change at different
speeds must not be able to contaminate each other. Tasks change hourly.
Playbooks change weekly. Standards change monthly. The specification changes
rarely and deliberately. Letting a fast layer edit a slow one is how strategy
drifts without anyone deciding to drift it.

### What belongs in the conserved set

A path is worth conserving when a wrong change to it is expensive and quiet:
the damage does not surface in the next test run, it surfaces months later as a
system that no longer behaves the way its documentation says.

### Three layers of enforcement, honestly ranked

1. **Compliance.** Operators read the rule and obey it. Weakest, and most often
   mistaken for the whole system.
2. **Review.** All work is diffs. Conserved changes are visible, detectable,
   and reversible. This is the real guarantee.
3. **Mechanical gate.** Code ownership plus branch protection makes the
   boundary physical.

Layer 3 without layer 2 is theatre. Layer 2 without layer 3 works until the day
nobody reads the diff.

### The ruling

A ruling records the decision, the deciding person's canonical ID, the date,
and their own words verbatim. Not a paraphrase. An agent may draft the wording.
It may not be the actor.

---

## WRITE DISCIPLINE

The sync verification protocol says how to run a state-mutating sync safely.
Write discipline says how to build the write path so a crashed or colliding
operator leaves a state a fresh run can finish.

- **Deterministic references.** Every external write carries an identity
  derived from its cause. The same cause maps to the same reference forever, so
  a re-run detects prior work instead of repeating it.
- **The external system is the write-ahead log.** Stamp evidence into the
  system being mutated. Local progress state dies with the session holding it,
  which is exactly when it is needed.
- **Recovery is re-running the process.** Design every sequence so that
  stopping anywhere leaves a state a fresh run can finish.
- **Fresh pre-write reads, never cache.** An unexplained mid-run change is an
  implicit foreign lease. Halt.
- **Post-read every write.** A write you did not read back is a write you do
  not know happened.
- **Bulk pulls prove presence, never absence.** Paged lists lie at the cutoff
  and under load. Re-verify any "does not exist" conclusion directly.
- **Derive state from the owning side.** State lives on the record, not on
  whatever names it from the other side of a link.
- **Corrections supersede, never rewrite.** The company may be publicly wrong
  and visibly repair itself. That is only possible if history is never edited.
- **A confident-looking signal is not verification.** An empty result, an error
  message's literal wording, a document's stated cadence: each can be mistaken
  for ground truth because it looks authoritative.

---

## CONCURRENCY BETWEEN OPERATORS

A company running several agents on a schedule, plus humans, plus a runtime
host, has the same concurrency problem as any distributed system.

- **The write discipline is the real boundary.** Everything else is
  coordination on top of it. Two operators politely taking turns can still both
  write stale data.
- **Session leases are advisory.** An operator mutating shared state announces
  it, with a heartbeat. Reads never need a lease. A stale lease may be broken,
  and the break is recorded.
- **Fencing is the rule that matters.** The holder re-reads its own lease
  before every mutation batch. Missing or replaced means halt immediately. A
  superseded session must never write again.
- **Deadman checks.** A scheduled unit that stops running produces silence, not
  an error, and silence looks identical to a healthy system with nothing to
  report. Anything expected to report on a cadence declares that expectation,
  and something checks the report arrived.

---

## THE FIVE PROPERTIES

Any implementation of this pattern has to be all five of these. Dropping one
collapses it back into documentation.

1. **Queryable.** Relationships between people, modules, agents, obligations,
   and systems can be traced without reading prose.
2. **Versionable.** Every change is explicit, attributed, diffable, reversible.
3. **Integrated.** State moves between the coordination layer and the systems
   that hold the truth, in a declared direction.
4. **Testable.** A change can be modelled before it becomes real.
5. **Accessible.** Non-technical operators can participate.

The fifth is the one every implementation of this idea underdelivers on,
including this one. Say so plainly rather than claiming it.

---

## ADOPTION: FEDERATE, DO NOT MIGRATE

The most common way to fail at this is to treat it as a migration.

Systems keep running and keep owning their data. The repository starts as the
coordination layer above them: it records which system is authoritative for
what, holds the canonical IDs, and runs one real process end to end.

**A company is on Company-as-Code the day one real decision flows through the
loop. Not the day its data moves.**

Structure without content is the failure mode this framework is most likely to
produce, because the structure is the easy part. A folder without a manifest
declares no logic, which is legitimate. A repository that is entirely such
folders declares nothing at all.

---

## DESIGN PRINCIPLES

Prioritize:

- simplicity over enterprise bloat
- composability over rigidity
- operational clarity over abstraction
- interoperability over lock-in
- observability over opacity
- automation over manual coordination
- asynchronous execution over meetings
- systems thinking over heroics

### Additional principles drawn from operating the framework

- **every entity sits on the canonical state ladder**: L1 universal lifecycle bucket, L2 domain-native journey, L3 operational substate; no canonical state means no presence in the substrate
- **declare before code**: manifests, interfaces, and invariants are stated explicitly before implementation
- **coordinate, don't replicate**: the coordination layer holds the minimum state needed to orchestrate; authoritative data stays at its source
- **one writer per field**: unidirectional mutation flow is the default; bidirectional sync is a special case that requires a documented protocol
- **dry-run first**: every write path supports dry-run; first invocations always go through it
- **HITL invariants are declarative**: human-in-the-loop is a property of the system, not a convention in prose
- **typed events over free text**: state transitions emit enum-typed events; free-text event logs are a code smell
- **canonical IDs are permanent**: internal IDs survive system migrations, vendor switches, and entity merges
- **standards live in the repo**: if a rule isn't versioned, it isn't enforceable
- **verify before trust**: recalled context is a claim until verified against current state
- **plans before non-trivial work**: write the plan, park-friendly; resume from the plan, not from memory
- **migrations are timestamped**: never sequential filenames in a multi-contributor environment
- **one writer per edge, not just per field**: a reference is declared from one side only; two lists that must agree eventually disagree
- **every reference is typed**: a reference field names the kind it points at, so the corpus is a traversable graph rather than documents that mention each other
- **the graph is cyclic**: a company is not a DAG; an implementation that forces acyclicity either deletes real edges or refuses to draw them
- **obligations fail the build, not the audit**: an uncovered requirement is a build failure
- **fallback chains terminate in something that cannot be absent**: never in an agent
- **conserved surfaces change through a ruling**: recorded, attributed, quoted verbatim
- **write paths are built for interruption**: deterministic references, evidence in the target system, recovery by re-running
- **absence is never inferred from an empty page**: bulk pulls prove presence only

---

## ANTI-PATTERNS TO AVOID

These are failure modes the framework has been deliberately shaped to prevent.

### Nothing built on dirty data

- do not automate processes that operate on uncleaned source data
- automation amplifies whatever shape the data is in, including its errors
- before automating, normalize the data; the normalization itself often reveals the real problem
- the discipline: clean first, automate second

### No silent destruction

- never hard-delete; soft-delete with a tombstone
- never silently merge; record the merge and which canonical ID survived
- never overwrite a remote state without first reading it; concurrent edits are real

### No hand-merging of generated files

- generated files are deterministic outputs of source declarations
- a hand-merge is almost always wrong and will be rejected by CI on the next push
- the resolution path is regeneration, not negotiation

### No force-push to protected branches

- force-push to main / production branches is a history-rewriting attack vector
- even when "safe" within a session, the policy is uniform: tighten branch protection to disallow it
- if a commit needs correction, amend before pushing or accept the extra commit

### No vendor lock-in

- the framework names no vendor as canonical
- interfaces are abstract; integrations are pluggable
- a sufficiently determined operator must be able to swap any system without rewriting business logic

### No autonomous writes to irreversible surfaces

- writes to external systems with real-world consequences (billing, contracts, communications, public surfaces) are HITL by default
- autonomous mode is allowed only after the path has accumulated reliability evidence and the failure modes are bounded

### No replication as a substitute for coordination

- mirroring an external system's full state into the coordination layer is a code smell
- the coordination layer is for canonical IDs, state machines, and orchestration metadata, not for being a second copy

### No tribal-knowledge runbooks

- if an operational procedure is not in the repo, it does not exist
- "ask the person who knows" is an organizational debt to be paid down, not a process

### No untyped references

- a reference field that does not name the kind it points at cannot be resolved, so nothing checks it
- untyped references accumulate silently; the only way to find them is to build the resolver, at which point you find all of them at once

### No compliance as prose

- a control that exists only in a document cannot fail a build
- a coverage matrix maintained by hand disagrees with reality within a quarter, and nobody notices until an auditor asks

### No fallback chain that terminates in an agent

- an agent can lose credentials, hit a limit, or be removed in a refactor
- the last link in a chain must be something that cannot itself be absent

### No structure ahead of content

- scaffolding all three domains and thirty subdirectories on day one produces a repository that describes nothing
- add the second module when a second module actually consumes something

---

## README POSITIONING

The README should position the project as:

### Headline

Company-as-Code

An open-source operating system for AI-native organizations.

### Subheadline

Run your company like software:

- observable
- versioned
- orchestrated
- automatable
- continuously improving

### Positioning

Company-as-Code transforms organizations into:

- executable systems
- observable systems
- agent-operable systems

The framework combines:

- GitOps
- organizational design
- workflow orchestration
- observability
- AI agents
- operational execution

into a single operational runtime.

### Core Message

This is not project management software.

This is:

- an executable organizational graph
- an AI-native operational runtime
- a coordination layer for humans and agents
- infrastructure for modern companies

### Taglines

Possible taglines:

- GitOps for companies
- Kubernetes for organizations
- Terraform for operations
- The operating system for AI-native companies
- Observable operations for modern organizations
- Infrastructure-as-Code for business execution

---

## SUCCESS CRITERIA

A successful implementation should allow companies to:

- run operations from a repository
- orchestrate humans and AI together
- automate repetitive work
- observe execution in real time
- scale operational complexity
- reduce meetings
- reduce tribal knowledge
- improve accountability
- continuously optimize execution
- fork and adapt operating models

The resulting project should feel:

- modern
- technically elegant
- operationally opinionated
- deeply useful
- highly forkable
- AI-native
- automation-first
- extensible
- composable

The project should become:

- a reference implementation for AI-native organizations
- a default operational framework for modern companies
- a highly starred open-source repository
- a foundational primitive for future organizational infrastructure
