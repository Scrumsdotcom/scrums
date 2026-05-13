# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

When the schema for a canonical primitive changes in a backwards-incompatible way, that's a **major** bump. New optional fields or new primitives are **minor**. Tooling and documentation fixes are **patch**.

---

## [Unreleased]

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

(Merged via PRs #2 and #3; tagging deferred until the schema-completeness PR also lands.)

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

[Unreleased]: https://github.com/gez-scrumsdotcom/Company-as-Code/compare/v0.1.0...HEAD
[0.2.0]: https://github.com/gez-scrumsdotcom/Company-as-Code/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/gez-scrumsdotcom/Company-as-Code/releases/tag/v0.1.0
