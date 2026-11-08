# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Release numbers follow [`docs/standards/versioning.md`](./docs/standards/versioning.md#release-numbers). While the framework is 0.x, a backwards-incompatible change to document shape ships with a migration and is a **minor** release; after 1.0.0 it is **major**. New optional fields or new primitives are **minor**. Tooling and documentation fixes are **patch**. Releases up to and including 0.6.0 were numbered under the earlier wording of this paragraph.

---

## [Unreleased]

Making a fork a long-term asset rather than a snapshot. The theme: a fork
should be able to take the next release with a command, not a merge.

### Added, The framework/instance boundary

- **Four path classes.** Every file is framework (upstream's, replaced on upgrade), adapt (a starting point the fork edits), instance (the fork's, never touched), or derived (regenerated). Declared once in `cli/src/boundary.ts`. See [ADR-0008](./docs/adr/0008-framework-instance-boundary.md) and [`framework-boundary.md`](./docs/standards/framework-boundary.md).
- **`cac.yaml`**, validated against the new `Instance` schema, says whether a tree is upstream or a fork, its namespace, and the framework release it is on. **`framework.lock.json`** records a hash of every framework and adapt file, regenerated and drift-gated upstream.
- **`cac boundary check` and `cac boundary explain`**, plus `cac init` to declare a fork. CI runs the boundary check. `cac doctor` warns on what the check would fail.
- **Fork namespacing.** Fork decisions live in `company/decisions/`; fork hub modules are named `<namespace>-<name>`. See [`fork-namespacing.md`](./docs/standards/fork-namespacing.md).

### Added, Upgrades and migrations (scaffold)

- **`cac upgrade --from <release>`** compares the fork's lock, the new release's lock, and the files on disk, and decides each file: update, add, remove, keep the fork's change, or stop at a conflict. Dry-run by default; refuses to write past a conflict. See [`docs/upgrading.md`](./docs/upgrading.md).
- **`cac migrate`** moves documents to the current document version through a numbered chain of text-transform migrations in `cli/src/migrations/`.

### Changed, Honest versioning (breaking)

- **Documents are now `company-as-code/v1alpha1`**, and every schema `$id` is `https://gez-scrumsdotcom.github.io/Company-as-Code/schemas/v1alpha1/<name>.schema.json`. The old `company-as-code/v1` promised a stability the format did not have. Run `cac migrate --write` to move existing documents; `cac validate` names any document that still needs it. See [ADR-0009](./docs/adr/0009-honest-versioning.md) and [`versioning.md`](./docs/standards/versioning.md).
- The release checklist's versioning policy now matches the 0.x release line.

### Added, Conformance suite (scaffold)

- **`conformance/`** holds cases with an expected verdict, and a protocol any implementation can run: read a directory, print `{valid, failures:[{rule, file}]}`. `cac conformance` runs the suite against the reference implementation or any `--impl` command. Ten cases across classification, schema, reference, and cross-document rules. See [ADR-0010](./docs/adr/0010-conformance-suite.md).

### Added, Importers (scaffold)

- **`cac import`** drafts documents from existing records into `company/.drafts/`, where validate and generate cannot see them, and `cac import accept` moves them into the corpus after validation, refusing to overwrite an existing identity. Ships with an org-chart CSV importer for people and teams. See [`docs/importing.md`](./docs/importing.md).

### Added, Stewardship

- **[`docs/governance/stewardship.md`](./docs/governance/stewardship.md)**: who decides today, what will not change if the lead maintainer's priorities do, the path to maintainer and to a second code owner, the hand-over commitment, and when a foundation would make sense.
- **[`docs/governance/discussion.md`](./docs/governance/discussion.md)**: seven open governance questions, each with options and a current leaning.

### Changed, Tooling

- CLI test files run sequentially (`fileParallelism: false`). Several suites write scratch documents into the shared corpus, and running them in parallel let one suite see another's scratch files.
- The Proposal `surface` enum gains `ci` and `governance`.

### Security

- **Local dashboards refuse cross-site and DNS-rebinding requests.** The HITL inbox and the cognition graph check the `Host` header against the loopback address they are bound to. `POST /api/resolve` requires `content-type: application/json` and, when an `Origin` is sent, the dashboard's own origin.
- **`cac-host execute` refuses `--live` with `--auto-approve`.** Live external writes keep their human gate.
- **`cac upgrade` refuses a lock with paths outside the repository** (absolute paths, `..` or `.` segments, backslashes).
- **Workflows:** every checkout sets `persist-credentials: false`. `security.yml` grants write scopes per job. `release.yml` runs the gates with a read-only token and no dependency cache; only the publish job, which runs no project code, holds `contents: write`.

### Changed, Provenance and schema host

- **Schema `$id` host:** `https://gez-scrumsdotcom.github.io/Company-as-Code/`, also the base of the JSON-LD `cac:` namespace. See [ADR-0009](./docs/adr/0009-honest-versioning.md) and [PROP-0007](./company/proposals/PROP-0007-public-provenance-and-schema-host.yaml).
- **Provenance:** Gerald Neves created, owns and maintains Company-as-Code. Scrums.com runs an implementation of the pattern. `NOTICE`, `MAINTAINERS.md`, `GOVERNANCE.md`, `SUPPORT.md`, the FAQ and the stewardship pages say so.
- **Contributions need a sign-off.** `CONTRIBUTING.md` adopts the Developer Certificate of Origin. `SECURITY.md` names GitHub private vulnerability reporting as the only channel.
- `docs/plans/seed-build.md`, a build log from the first seed, is removed.

---

## [0.6.0], 2026-08-16

Typed edges, compliance as code, and the conserved core. The theme is the same
one the framework keeps returning to: a rule that cannot fail a build is a
preference.

### Added, Typed reference edges

- **`x-cac-ref` schema annotation.** Every cross-document reference field now names the primitive kinds it may point at. A reference is a typed edge to a known kind of entity rather than a string that happens to look like an ID.
- **One generic resolver** (`cli/src/refs.ts`) replaced four hand-written existence checks and expanded coverage from four reference fields to thirty-one. Adding a reference field is now a one-line schema annotation instead of a new check in the validator.
- **The edge set is inventoried in a test.** Adding a reference field without annotating it fails, and so does annotating something that should not be an edge.
- See [ADR-0007](./docs/adr/0007-typed-reference-edges.md).

### Fixed, 24 dangling references in the shipped seed

Running the resolver for the first time found twenty-four broken references
that no existing check could see. All are closed:

- **Six modules were consumed from but had never declared a manifest** (`sales`, `customer`, `people`, `governance`, `delivery`, `security`). The repository had been violating its own "no consumes entry without a corresponding exposes entry" rule since the first commit. Each now declares the interface it exposes.
- **`company/runtime` had no manifest** despite owning the incident-response workflow and being named as a task's module.
- **Two dashboards** (`growth-overview`, `deploy-frequency`) were referenced by four documents and never defined.
- **Two metrics** (`METRIC-PLATFORM-DEPLOY-MTTR`, `METRIC-RUNTIME-MTTR`) were referenced by workflows and never defined.
- **Two automations** (`pre-flight-checks`, `deploy-to-prod`) were called by name from the production-deploy workflow and did not exist.
- **Twelve rotted relative links** in two playbooks, found by the new health inspection.

### Added, Compliance as code

- **`Requirement` and `Control` primitives.** A Requirement states what must be true and where the obligation comes from. A Control states how it is kept true, how it is verified, on what cadence, and where the evidence lands. The edge runs one way: Controls name Requirements, never the reverse.
- **The coverage gate.** An in-scope Requirement with no operating Control fails `cac validate`. Two explicit escape hatches: `planned`, and `out-of-scope` with a required written rationale.
- **`/generated/control-matrix.json`** inverts the coverage edges into per-requirement coverage, per-framework totals, an explicit `gaps` array, and a column distinguishing machine-verified coverage from human promises.
- **Worked examples:** seven requirements across ISO 27001, SOC 2, GDPR, the EU AI Act, and internal rules; six controls, five of them pointing at checks that actually run in this repository.
- See [`/docs/compliance.md`](./docs/compliance.md) and [ADR-0006](./docs/adr/0006-compliance-and-capability-layer.md).

### Added, Capabilities and fallback chains

- **`Capability` primitive.** A primary owner, an ordered fallback chain, a final fallback that cannot itself be absent, and a per-link `delivers` field stating honestly how much of the capability survives each hop.
- **Four enforced rules:** the chain never terminates in an agent; a holder never appears twice; high and critical capabilities carry an intermediate fallback; a critical capability never terminates in a triage-only holder.
- **`/generated/capability-map.json`** reports degradation depth, permanently degraded capabilities, and ownership concentration, which is the company's real single-point-of-failure list.
- See [`/docs/capabilities.md`](./docs/capabilities.md).

### Added, The conserved core

- **`Proposal` primitive.** The mutation queue for the spec, standards, schemas, policies, requirements, controls, and CI workflows. Reason, evidence, benefit, validation, rollback, and a ruling carrying the decider's canonical ID and their words verbatim.
- **`.github/CODEOWNERS`** makes the conserved boundary physical rather than a convention people are asked to remember.
- **[`/docs/standards/conserved-core.md`](./docs/standards/conserved-core.md)** with an honest three-layer enforcement statement: compliance, review, mechanical gate, ranked by how much they can actually be trusted.
- **[PROP-0001](./company/proposals/PROP-0001-compliance-and-capability-layer.yaml)** is the proposal that added the folder it lives in.

### Added, `cac doctor`

- Standing health inspection with two severities. Findings fail; warnings report and pass. `--strict` promotes warnings.
- Eleven checks: rotted relative links, missing conserved-core gate, stale and unverified controls, modules with nobody accountable, autonomous agents that nothing watches, high-criticality capabilities with no metric behind them, isolated graph entities, and open proposals with no ruling.
- Control staleness is measured against the newest verification date in the repository rather than wall-clock time, so the same commit produces the same output on every machine and in every replay.
- Runs in `validate.yml`. See [`/docs/doctor.md`](./docs/doctor.md).

### Added, The company graph and semantic interoperability

- **`/generated/company-graph.json`** derived from the typed edges plus module containment. Cyclic by construction: a company is not a DAG, and forcing acyclicity means either deleting real edges or refusing to draw them.
- **`/generated/context.jsonld`** maps the primitives onto schema.org, the W3C Organization ontology, PROV-O, OSCAL, SKOS, and Dublin Core, so an external system can consume an export without a bespoke adapter.
- See [`/docs/interoperability.md`](./docs/interoperability.md).

### Added, Standards and documentation

- **[Write discipline](./docs/standards/write-discipline.md)**: nine rules for building external write paths that survive crashes and collisions. Deterministic references, the target system as write-ahead log, fresh pre-write reads, post-read every write, bulk pulls prove presence never absence, corrections supersede rather than rewrite.
- **[Concurrency](./docs/standards/concurrency.md)**: session leases, the fencing rule that makes breaking a stale lease safe, and deadman checks for scheduled units whose failure mode is silence.
- **[Adoption](./docs/adoption.md)**: federate rather than migrate, the five properties any implementation of this pattern needs, and calibration signals for healthy and unhealthy adoption. Includes an honest assessment of where this implementation is weakest.

### Added, Project governance and release engineering

- **[`GOVERNANCE.md`](./GOVERNANCE.md)**, **[`SUPPORT.md`](./SUPPORT.md)**, **[`NOTICE`](./NOTICE)**, **`CITATION.cff`**, `.editorconfig`, `.gitattributes`, and an issue-template contact config.
- **`release.yml`** fires on a version tag, re-runs validate, the drift gate, doctor, and both test suites, confirms all three `package.json` versions and the CHANGELOG heading agree with the tag, and publishes the release from the CHANGELOG entry. A tag that cannot pass the project's own gates does not become a release.
- **`scorecard.yml`** runs OpenSSF Scorecard weekly and on branch-protection changes. The framework argues that a company's posture should be measured rather than asserted; the same applies to the repository making the argument.
- **Dependabot regrouped.** The previous configuration left GitHub Actions ungrouped, so each action opened its own PR, and split npm by dev versus production, which doubled the count. Across the project's history 15 of 32 closed Dependabot PRs were closed unmerged: roughly half the review attention went to noise. Each ecosystem now opens at most two PRs, one for minor and patch bumps and one for majors, with a release cooldown of 3, 7, and 30 days. GitHub Actions moves to monthly because every reference is SHA-pinned. Security updates are exempt from all of it.
- **`NOTICE`** records what was adopted from neighbouring projects and from Daniel Rothmann's "Company as Code", with licences. Each is an idea reimplemented, not code copied.

### Changed

- **Node floor raised to 22.** Node 20 left maintenance in April 2026. CI matrix is now 22 and 24.
- **Runtime toolchain aligned with the CLI**: TypeScript 6, vitest 4, `@types/node` 26.
- **`emptyCorpus()` is exported from the loader** and used by both the production loader and the tests, so adding a primitive can no longer leave a test file behind with a missing bucket.
- **`docs/anatomy/agent.md`** now explains why a model name in `runtime` is wrong in general, rather than naming one model that was current when the line was written.
- **[`/docs/standards/policy-to-control-matrix.md`](./docs/standards/policy-to-control-matrix.md)** extended from 32 rules to 48.
- **Em dashes removed repository-wide.** 1,483 of them, replaced with the punctuation that carries the meaning: colons for definitions, parentheses for asides, full stops between independent clauses, commas for the rest. The release checklist now includes a check that keeps the count at zero.

### Fixed: Enforcement-gap pass (declared rules become enforced rules)

- **Unrecognized or missing `kind:` now fails validation.** Previously a one-character typo (`kind: Agnet`) silently dropped the document from the corpus and validation passed. The loader reports every unclassified `/company` YAML; intentional non-primitive YAML opts out with a `# cac:ignore` pragma. `Event`, `StateSnapshot`, and `ShadowEnrollment` kinds are now classified and schema-validated.
- **Runtime branch steps actually jump.** The executor's branch bookkeeping looked up the decision under the wrong step ID, so every workflow fell through sequentially while the audit ledger recorded `branchedTo`. Branch decisions now take effect immediately, unknown targets halt with an audited failure, and a max-iterations guard stops branch cycles. Covered by three new executor tests.
- **`event.schema.json` accepts registered event types.** Its `type` pattern rejected snake_case segments, i.e. every type in the shipped registry including its own documented example. Both schemas now share an identical `$defs.eventType` (equality enforced by test), and a test validates a sample Event row for every registered type.
- **Python SDK enforces required fields.** Generated TypedDicts dropped `total=False` (which made every `NotRequired` marker a no-op and let `{}` type-check as a valid document). Non-object `$defs` now emit as aliases in both SDK targets, and comment-only TypedDict bodies get an explicit `pass` (the generated `escalation_policy.py` previously did not parse).
- **Strict CLI flag parsing.** All subcommands parse flags with `node:util` `parseArgs` (`strict: true`): `cac generate --chek` now exits non-zero instead of silently running the write-mode generator, string options refuse to swallow a following flag as their value, and `cac hub add --into` refuses destinations that resolve outside `/company`. Added `cac version`.
- **Secret scan is blocking.** Removed `continue-on-error` from the gitleaks CI step (PR annotations disabled instead); dropped the `pull-requests: write` grant. `SECURITY.md` no longer claims pre-commit hooks that don't exist.
- **Authoring templates validate as shipped.** Five of eight YAML templates failed their own schemas (null bodies where arrays are required; the workflow template's `human` trigger missing its `actor`; the dry-run step missing `automation`). All templates now pass, and a new test validates every template in CI.
- **Getting-started walkthrough is truthful end-to-end**: corrected stale document counts and the generated-file inventory, and added step 10 running `month-end-close` through the runtime host dry-run (commands verified).
- **CI typechecks both packages** (`tsc --noEmit`) and exercises Node 20/22/24 (better-sqlite3 is a native addon; only Node 20 was covered).
- **Version story reconciled**: CHANGELOG backfilled for the v0.4/v0.5 cycles, README status line corrected, roadmap contradictions resolved (ADR-0005 records the CaC-Hub scope decision), release checklist added.

---

## [0.5.0]: 2026-05-14

Two roadmap cycles (v0.4.0 and v0.5.0) shipped together in PR #13; they are
recorded as one release. There is no separate v0.4.0 tag.

### Added: v0.4.0 cycle: schema-driven SDKs, tracing, snapshotting, HITL inbox

- **Schema-driven SDKs.** The CLI projects every JSON Schema into type-safe SDKs under `/generated/sdk/typescript` (interfaces + a `CompanyDocument` discriminated union) and `/generated/sdk/python` (TypedDicts). Drift-gated like every other generated artefact.
- **Native OpenTelemetry tracing.** The runtime opens a root span per workflow execution and a child span per step; the W3C trace ID is stamped onto both the audit log and the typed-event ledger. `cac-host trace <id>` prints the interleaved timeline.
- **Versioned state snapshotting.** `cac-host snapshot create / list / show / rollback` checkpoints canonical state into a content-hashed row and atomically restores it. Ledgers are never rewound; a rollback is itself an event.
- **Native HITL inbox + dashboard.** `--queue-approvals` routes `human-approval` steps through a durable inbox; humans resolve dry-run projections from the CLI or the `cac-host inbox serve` web dashboard, with their canonical Person ID recorded.
- New schema: `StateSnapshot`. New event types: `coordination.state_snapshot_created`, `coordination.state_rolled_back`. `AuditRecord` + `Event` gained `traceId` / `spanId`.

### Added: v0.5.0 cycle: ecosystem & experience

- **CaC-Hub module registry.** `hub/modules/*` holds importable modules (`HubModule` schema wrapping a schema-valid `payload/`). `cac hub list / show / add / validate`; `cac hub add` is dry-run by default. `/generated/hub-index.json` is generated + drift-gated. Ships with `standard-hr` and `subscription-billing`. See ADR-0005 for how this relates to the "marketplace" non-goal.
- **NL2M (Natural Language to Manifest).** `cac nl2m "<prose>"` drafts a linked, schema-valid Initiative + Goal + Metric triple, deterministic heuristic parser, dry-run by default, `nl2m: review` markers on every inferred field. See `/docs/nl2m.md`.
- **Visual Cognition Graph.** `cac generate` emits `/generated/cognition-graph.json`; `cac-host graph serve` renders it interactively, overlaid with live audit/event/HITL activity. See `/docs/cognition-graph.md`.
- **Shadow Mode for agents.** `cac-host shadow enroll <agent>` forces perpetual `dryRun: true`, recording reliability evidence (`ShadowEnrollment` schema); `shadow status` evaluates it against the AutonomyPolicy promotion bar; `shadow propose` drafts the promotion ADR. See `/docs/shadow-mode.md`.

### Docs

- **Canonical state ladder** (L1 executive rollup / L2 operating state / L3 module detail) documented as the company substrate (PR #12). Schema representation is roadmapped, not yet enforced.

---

## [0.3.0]: 2026-05-13

### Added: Hardening pass: drift orphans, conditional schemas, supply-chain CI, governance matrix

- **Drift gate flags orphans.** `cli/src/generate.ts` `checkDrift` now walks `/generated/**` and fails when any file present is not emitted by a generator. Stale artefacts can no longer hide.
- **Generator idempotency contract test.** `cli/test/generate.test.ts` regenerates twice and asserts byte-identical output; also asserts orphan detection fires correctly.
- **Conditional schema rules on workflow trigger + step kinds:**
  - `trigger.kind=schedule` requires `schedule:`; `kind=event` requires `event:`; `kind=human` requires `actor:`
  - step `kind=agent` requires `agent:`; `kind=automation`/`dry-run`/`live-write` requires `automation:`; `kind=human-approval` requires `approver:`; `kind=emit-event` requires `emitsEvent:`; `kind=branch` requires `branches:`
- **Manifest agent summaries ↔ standalone files must agree.** New cross-doc check enforces module path resolution, manifest listing, discrete-field equality (`autonomy`, `cadence`, `runtime`, `schedule`), and round-trip completeness. The standalone file is the single source of truth.
- **Four new standalone agent files for the executive layer** (`ceo-strategist`, `finance-ops-roll-up`, `product-ops-roll-up`, `gtm-roll-up`), closing the gap surfaced by the new check.
- **Security workflows in CI** (`.github/workflows/security.yml`):
  - gitleaks secret scanning
  - `npm audit --omit=dev --audit-level=high` for `cli/` and `runtime/`
  - CodeQL JavaScript/TypeScript analysis
  - Runs on every PR + weekly cron
- **`npm ci` strict in CI**: removed `|| npm install` fallback from `validate.yml` and `generate-check.yml`. Lockfile is authoritative.
- **All GitHub Actions pinned by SHA**, not by tag.
- **Dependabot** (`.github/dependabot.yml`), weekly PRs to bump action SHAs and dependency versions across both packages.
- **Ajv `strict: true`** in `cli/src/validate.ts`, with `allowUnionTypes` for legitimate cases. Caught and fixed several ambiguous constructs in `workflow.schema.json`.
- **9 new negative-fixture tests** in `cli/test/negative-fixtures.test.ts`, adversarial documents that must fail validation.
- **`docs/standards/policy-to-control-matrix.md`**: every declared rule mapped to its enforcement location (schema / CI / runtime / discipline). The declared-vs-enforced gap is now impossible to hide.
- **`docs/standards/security.md`** aligned to actual enforcement (each claim points at the workflow or config that backs it).
- **`docs/architecture.md`** aligned, the vague "CI enforces" sentence replaced with a precise breakdown referencing the matrix.

### Added: Reference runtime host (TypeScript)

- **New `/runtime/` package.** TypeScript daemon-style CLI (`cac-host`) that loads the manifest graph from a clone, executes workflows (dry-run by default, opt-in `--live`), and persists audit + event records.
- **Commands:** `cac-host load`, `cac-host execute <workflow> [--live] [--auto-approve]`, `cac-host audit <correlationId>`, `cac-host events --type <name>|--entity <id>`.
- **Two reference backends behind a common interface:**
  - `SqliteSinks`: zero-config local; WAL journal mode; indexed by correlation, type, entity (`better-sqlite3`).
  - `PostgresSinks`: production-grade; JSONB payloads; auto-creates schema on first connection (`pg`).
- **Execution-time invariants enforced by the runtime:**
  - HITL workflow + scheduled trigger is refused at load (throws).
  - `live-write` requires a prior dry-run audit row under the same correlation ID (refuses the step otherwise).
  - `emit-event` rejects types not registered in the `EventTypeRegistry`.
  - Every step writes an audit row, including failures and refusals.
- **Pluggable invokers:** `AgentInvoker`, `AutomationInvoker`, `ApprovalProvider`, reference implementations ship but are deliberately minimal. Forks plug in real AI runtimes, integration clients, and approval surfaces.
- **8 new vitest cases** covering the sinks and the executor (workflow round-trip, event emission, live-write safety rail, hitl-on-schedule refusal, registry enforcement).
- **`/docs/anatomy/runtime-host.md`**: field-by-field deep-dive on the runtime.
- **CI updated** to install + test the runtime host on every PR.
- **`/runtime/runtime.db*`** added to `.gitignore`, operational state is never committed.

### Added: Schema completeness for runtime primitives

- **Five new JSON Schemas** covering every illustrative YAML now shipped in the seed:
  - [`schemas/dashboard.schema.json`](./schemas/dashboard.schema.json), Dashboard panels, audience, refresh, alerts
  - [`schemas/automation.schema.json`](./schemas/automation.schema.json), Automation inputs, outputs, mutates, invariants, failure modes
  - [`schemas/event-type-registry.schema.json`](./schemas/event-type-registry.schema.json), the enum-controlled event-type registry (one per company)
  - [`schemas/autonomy-policy.schema.json`](./schemas/autonomy-policy.schema.json), runtime expression of the three autonomy classes + promotion path
  - [`schemas/escalation-policy.schema.json`](./schemas/escalation-policy.schema.json), severity SLAs, role bindings, channel routing
- **Five new cross-document discipline checks** in the CLI validator:
  - Automations that `mutates[]` state must declare a `dryRun` input
  - Dashboard alert routing must resolve to a role in some `EscalationPolicy` (including fallbacks)
  - `AutonomyPolicy` and `EscalationPolicy` are singletons; multiple loaded documents fail validation
  - `EventTypeRegistry` is a singleton; multiple documents fail validation
  - Workflow `steps[].emitsEvent` and Agent `outputs[].emitsEvent` must reference a type registered in the `EventTypeRegistry`
- **Seven new vitest cases** (19 total, up from 12): one per new schema's failure mode, plus the new cross-document checks
- **[`docs/roadmap.md`](./docs/roadmap.md)**: explicit roadmap separating shipped / in flight / considered / declined items, with a section dedicated to the upcoming runtime-operationalization work

### Changed

- Every illustrative YAML in `/company/**` now carries `apiVersion: company-as-code/v1` and a `kind:` discriminator and **schema-validates**. The seed has no more illustrative-only documents.
- `/company/runtime/autonomy-policy.yaml` `promotion.*.requires` reshaped from a list of single-key objects to a flat object (matches the new schema)
- README and `AGENTS.md` navigation include the new roadmap link

### Internal

- `RepoCorpus` gains five new buckets (`dashboards`, `automations`, `eventTypeRegistries`, `autonomyPolicies`, `escalationPolicies`); schema bindings and `emptyCorpus()` test helper updated in lockstep

---

## [0.2.0]: 2026-05-13

(Merged via PRs #2 and #3.)

### Added: Skill primitive (PR #2)

- **Skill primitive (Tier-3 of the knowledge model).** `/schemas/skill.schema.json`, `/templates/skill.yaml`, and five worked skills under `/company/skills/` (`add-module`, `add-agent`, `add-integration`, `resolve-drift`, `sync-verification`).
- **Cross-runtime skill adapter generators.** One canonical YAML per skill produces three machine-readable variants under `/generated/skills/`:
  - `claude/<name>/SKILL.md`: Claude Code skill format
  - `agents-md/<name>.md`: provider-neutral AGENTS.md for Codex, Cursor, Aider, Continue, …
  - `gemini/<name>.gem.json`: Gemini Gems format (also compatible with OpenAI Assistants)
- `/generated/skill-index.json`: flat machine-readable index of every skill.
- `Agent.skills` field. Agents declare which Tier-3 skills they may invoke; cross-document validation rejects dangling references.

### Added: Detail pass (PR #3)

- **Root agent navigation.** `AGENTS.md` + `MAINTAINERS.md`.
- **Worked example in every previously-empty `/company/` folder**: policies, memory, prompts, events, runtime, dashboards, automations, playbooks, workflows, tasks.
- **Module playbooks** for every worked module (`production-deploy`, `launch-experiment`).
- **`/docs/anatomy/`**: field-by-field deep-dives on Manifest, Agent, Workflow.
- **`/docs/scenarios/`**: three end-to-end walkthroughs (monthly close, growth experiment, cross-domain incident).
- **`/docs/faq.md`** + **`/docs/forking.md`**.
- **ADRs 0002–0004**: modular monolith, unidirectional mutation, drift gate.
- **Mermaid diagrams** in `docs/architecture.md`.

---

## [0.1.0]: 2026-05-13

### Added

- Initial seed repository.
- Canonical specification at `docs/spec/company-as-code-spec.md`.
- JSON Schemas for canonical primitives: manifest, task, agent, workflow, initiative, goal, metric, event, audit-record, interface, organization, person, integration.
- Canonical `/company` directory structure across three domains (finance-ops, product-operations, sales-marketing) plus executive and top-level support directories.
- Authoring templates for manifests, agents, workflows, tasks, initiatives, goals, metrics, playbooks, plans, and ADRs.
- Worked examples in finance, platform, and growth modules; one `Integration`, one `Organization`, one `Person`.
- Reference TypeScript CLI with manifest validation, cross-document discipline checks, vitest unit tests, and deterministic generators (agent catalogue, flow registry, dependency graph, domain model, per-agent context bundles).
- CI workflows for schema validation, unit tests, and drift detection.
- Architecture documentation, getting-started guide, codified standards, glossary, and ADR 0001 bootstrapping the ADR process.
- Author attribution: Gerald Neves.

[Unreleased]: https://github.com/gez-scrumsdotcom/Company-as-Code/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/gez-scrumsdotcom/Company-as-Code/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/gez-scrumsdotcom/Company-as-Code/compare/v0.3.0...v0.5.0
[0.3.0]: https://github.com/gez-scrumsdotcom/Company-as-Code/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/gez-scrumsdotcom/Company-as-Code/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/gez-scrumsdotcom/Company-as-Code/releases/tag/v0.1.0
