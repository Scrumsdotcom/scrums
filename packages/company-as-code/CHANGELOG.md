# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

When the schema for a canonical primitive changes in a backwards-incompatible way, that's a **major** bump. New optional fields or new primitives are **minor**. Tooling and documentation fixes are **patch**.

---

## [Unreleased]

### Fixed — Enforcement-gap pass (declared rules become enforced rules)

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

## [0.5.0] — 2026-05-14

Two roadmap cycles (v0.4.0 and v0.5.0) shipped together in PR #13; they are
recorded as one release. There is no separate v0.4.0 tag.

### Added — v0.4.0 cycle: schema-driven SDKs, tracing, snapshotting, HITL inbox

- **Schema-driven SDKs.** The CLI projects every JSON Schema into type-safe SDKs under `/generated/sdk/typescript` (interfaces + a `CompanyDocument` discriminated union) and `/generated/sdk/python` (TypedDicts). Drift-gated like every other generated artefact.
- **Native OpenTelemetry tracing.** The runtime opens a root span per workflow execution and a child span per step; the W3C trace ID is stamped onto both the audit log and the typed-event ledger. `cac-host trace <id>` prints the interleaved timeline.
- **Versioned state snapshotting.** `cac-host snapshot create / list / show / rollback` checkpoints canonical state into a content-hashed row and atomically restores it. Ledgers are never rewound; a rollback is itself an event.
- **Native HITL inbox + dashboard.** `--queue-approvals` routes `human-approval` steps through a durable inbox; humans resolve dry-run projections from the CLI or the `cac-host inbox serve` web dashboard, with their canonical Person ID recorded.
- New schema: `StateSnapshot`. New event types: `coordination.state_snapshot_created`, `coordination.state_rolled_back`. `AuditRecord` + `Event` gained `traceId` / `spanId`.

### Added — v0.5.0 cycle: ecosystem & experience

- **CaC-Hub module registry.** `hub/modules/*` holds importable modules (`HubModule` schema wrapping a schema-valid `payload/`). `cac hub list / show / add / validate`; `cac hub add` is dry-run by default. `/generated/hub-index.json` is generated + drift-gated. Ships with `standard-hr` and `subscription-billing`. See ADR-0005 for how this relates to the "marketplace" non-goal.
- **NL2M (Natural Language to Manifest).** `cac nl2m "<prose>"` drafts a linked, schema-valid Initiative + Goal + Metric triple — deterministic heuristic parser, dry-run by default, `nl2m: review` markers on every inferred field. See `/docs/nl2m.md`.
- **Visual Cognition Graph.** `cac generate` emits `/generated/cognition-graph.json`; `cac-host graph serve` renders it interactively, overlaid with live audit/event/HITL activity. See `/docs/cognition-graph.md`.
- **Shadow Mode for agents.** `cac-host shadow enroll <agent>` forces perpetual `dryRun: true`, recording reliability evidence (`ShadowEnrollment` schema); `shadow status` evaluates it against the AutonomyPolicy promotion bar; `shadow propose` drafts the promotion ADR. See `/docs/shadow-mode.md`.

### Docs

- **Canonical state ladder** (L1 executive rollup / L2 operating state / L3 module detail) documented as the company substrate (PR #12). Schema representation is roadmapped, not yet enforced.

---

## [0.3.0] — 2026-05-13

### Added — Hardening pass: drift orphans, conditional schemas, supply-chain CI, governance matrix

- **Drift gate flags orphans.** `cli/src/generate.ts` `checkDrift` now walks `/generated/**` and fails when any file present is not emitted by a generator. Stale artefacts can no longer hide.
- **Generator idempotency contract test.** `cli/test/generate.test.ts` regenerates twice and asserts byte-identical output; also asserts orphan detection fires correctly.
- **Conditional schema rules on workflow trigger + step kinds:**
  - `trigger.kind=schedule` requires `schedule:`; `kind=event` requires `event:`; `kind=human` requires `actor:`
  - step `kind=agent` requires `agent:`; `kind=automation`/`dry-run`/`live-write` requires `automation:`; `kind=human-approval` requires `approver:`; `kind=emit-event` requires `emitsEvent:`; `kind=branch` requires `branches:`
- **Manifest agent summaries ↔ standalone files must agree.** New cross-doc check enforces module path resolution, manifest listing, discrete-field equality (`autonomy`, `cadence`, `runtime`, `schedule`), and round-trip completeness. The standalone file is the single source of truth.
- **Four new standalone agent files for the executive layer** (`ceo-strategist`, `finance-ops-roll-up`, `product-ops-roll-up`, `gtm-roll-up`) — closing the gap surfaced by the new check.
- **Security workflows in CI** (`.github/workflows/security.yml`):
  - gitleaks secret scanning
  - `npm audit --omit=dev --audit-level=high` for `cli/` and `runtime/`
  - CodeQL JavaScript/TypeScript analysis
  - Runs on every PR + weekly cron
- **`npm ci` strict in CI** — removed `|| npm install` fallback from `validate.yml` and `generate-check.yml`. Lockfile is authoritative.
- **All GitHub Actions pinned by SHA**, not by tag.
- **Dependabot** (`.github/dependabot.yml`) — weekly PRs to bump action SHAs and dependency versions across both packages.
- **Ajv `strict: true`** in `cli/src/validate.ts`, with `allowUnionTypes` for legitimate cases. Caught and fixed several ambiguous constructs in `workflow.schema.json`.
- **9 new negative-fixture tests** in `cli/test/negative-fixtures.test.ts` — adversarial documents that must fail validation.
- **`docs/standards/policy-to-control-matrix.md`** — every declared rule mapped to its enforcement location (schema / CI / runtime / discipline). The declared-vs-enforced gap is now impossible to hide.
- **`docs/standards/security.md`** aligned to actual enforcement (each claim points at the workflow or config that backs it).
- **`docs/architecture.md`** aligned — the vague "CI enforces" sentence replaced with a precise breakdown referencing the matrix.

### Added — Reference runtime host (TypeScript)

- **New `/runtime/` package.** TypeScript daemon-style CLI (`cac-host`) that loads the manifest graph from a clone, executes workflows (dry-run by default, opt-in `--live`), and persists audit + event records.
- **Commands:** `cac-host load`, `cac-host execute <workflow> [--live] [--auto-approve]`, `cac-host audit <correlationId>`, `cac-host events --type <name>|--entity <id>`.
- **Two reference backends behind a common interface:**
  - `SqliteSinks` — zero-config local; WAL journal mode; indexed by correlation, type, entity (`better-sqlite3`).
  - `PostgresSinks` — production-grade; JSONB payloads; auto-creates schema on first connection (`pg`).
- **Execution-time invariants enforced by the runtime:**
  - HITL workflow + scheduled trigger is refused at load (throws).
  - `live-write` requires a prior dry-run audit row under the same correlation ID (refuses the step otherwise).
  - `emit-event` rejects types not registered in the `EventTypeRegistry`.
  - Every step writes an audit row, including failures and refusals.
- **Pluggable invokers:** `AgentInvoker`, `AutomationInvoker`, `ApprovalProvider` — reference implementations ship but are deliberately minimal. Forks plug in real AI runtimes, integration clients, and approval surfaces.
- **8 new vitest cases** covering the sinks and the executor (workflow round-trip, event emission, live-write safety rail, hitl-on-schedule refusal, registry enforcement).
- **`/docs/anatomy/runtime-host.md`** — field-by-field deep-dive on the runtime.
- **CI updated** to install + test the runtime host on every PR.
- **`/runtime/runtime.db*`** added to `.gitignore` — operational state is never committed.

### Added — Schema completeness for runtime primitives

- **Five new JSON Schemas** covering every illustrative YAML now shipped in the seed:
  - [`schemas/dashboard.schema.json`](./schemas/dashboard.schema.json) — Dashboard panels, audience, refresh, alerts
  - [`schemas/automation.schema.json`](./schemas/automation.schema.json) — Automation inputs, outputs, mutates, invariants, failure modes
  - [`schemas/event-type-registry.schema.json`](./schemas/event-type-registry.schema.json) — the enum-controlled event-type registry (one per company)
  - [`schemas/autonomy-policy.schema.json`](./schemas/autonomy-policy.schema.json) — runtime expression of the three autonomy classes + promotion path
  - [`schemas/escalation-policy.schema.json`](./schemas/escalation-policy.schema.json) — severity SLAs, role bindings, channel routing
- **Five new cross-document discipline checks** in the CLI validator:
  - Automations that `mutates[]` state must declare a `dryRun` input
  - Dashboard alert routing must resolve to a role in some `EscalationPolicy` (including fallbacks)
  - `AutonomyPolicy` and `EscalationPolicy` are singletons; multiple loaded documents fail validation
  - `EventTypeRegistry` is a singleton; multiple documents fail validation
  - Workflow `steps[].emitsEvent` and Agent `outputs[].emitsEvent` must reference a type registered in the `EventTypeRegistry`
- **Seven new vitest cases** (19 total, up from 12): one per new schema's failure mode, plus the new cross-document checks
- **[`docs/roadmap.md`](./docs/roadmap.md)** — explicit roadmap separating shipped / in flight / considered / declined items, with a section dedicated to the upcoming runtime-operationalization work

### Changed

- Every illustrative YAML in `/company/**` now carries `apiVersion: company-as-code/v1` and a `kind:` discriminator and **schema-validates**. The seed has no more illustrative-only documents.
- `/company/runtime/autonomy-policy.yaml` `promotion.*.requires` reshaped from a list of single-key objects to a flat object (matches the new schema)
- README and `AGENTS.md` navigation include the new roadmap link

### Internal

- `RepoCorpus` gains five new buckets (`dashboards`, `automations`, `eventTypeRegistries`, `autonomyPolicies`, `escalationPolicies`); schema bindings and `emptyCorpus()` test helper updated in lockstep

---

## [0.2.0] — 2026-05-13

(Merged via PRs #2 and #3.)

### Added — Skill primitive (PR #2)

- **Skill primitive (Tier-3 of the knowledge model).** `/schemas/skill.schema.json`, `/templates/skill.yaml`, and five worked skills under `/company/skills/` (`add-module`, `add-agent`, `add-integration`, `resolve-drift`, `sync-verification`).
- **Cross-runtime skill adapter generators.** One canonical YAML per skill produces three machine-readable variants under `/generated/skills/`:
  - `claude/<name>/SKILL.md` — Claude Code skill format
  - `agents-md/<name>.md` — provider-neutral AGENTS.md for Codex, Cursor, Aider, Continue, …
  - `gemini/<name>.gem.json` — Gemini Gems format (also compatible with OpenAI Assistants)
- `/generated/skill-index.json` — flat machine-readable index of every skill.
- `Agent.skills` field — agents declare which Tier-3 skills they may invoke; cross-document validation rejects dangling references.

### Added — Detail pass (PR #3)

- **Root agent navigation.** `AGENTS.md` + `MAINTAINERS.md`.
- **Worked example in every previously-empty `/company/` folder** — policies, memory, prompts, events, runtime, dashboards, automations, playbooks, workflows, tasks.
- **Module playbooks** for every worked module (`production-deploy`, `launch-experiment`).
- **`/docs/anatomy/`** — field-by-field deep-dives on Manifest, Agent, Workflow.
- **`/docs/scenarios/`** — three end-to-end walkthroughs (monthly close, growth experiment, cross-domain incident).
- **`/docs/faq.md`** + **`/docs/forking.md`**.
- **ADRs 0002–0004** — modular monolith, unidirectional mutation, drift gate.
- **Mermaid diagrams** in `docs/architecture.md`.

---

## [0.1.0] — 2026-05-13

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
- Author attribution: Gerald Neves, Founder & CEO at Scrums.com.

[Unreleased]: https://github.com/gez-scrumsdotcom/Company-as-Code/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/gez-scrumsdotcom/Company-as-Code/compare/v0.3.0...v0.5.0
[0.3.0]: https://github.com/gez-scrumsdotcom/Company-as-Code/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/gez-scrumsdotcom/Company-as-Code/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/gez-scrumsdotcom/Company-as-Code/releases/tag/v0.1.0
