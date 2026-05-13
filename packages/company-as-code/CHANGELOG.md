# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

When the schema for a canonical primitive changes in a backwards-incompatible way, that's a **major** bump. New optional fields or new primitives are **minor**. Tooling and documentation fixes are **patch**.

---

## [Unreleased]

### Added — Detail pass: worked examples, scenarios, anatomy, ADRs, diagrams

- **Root agent navigation.** New [`AGENTS.md`](./AGENTS.md) at repo root — the canonical entry point for Claude, Codex, Cursor, Aider, Continue, Gemini, OpenAI Assistants, and any future runtime that consumes an `AGENTS.md`. New [`MAINTAINERS.md`](./MAINTAINERS.md) referenced from `SECURITY.md`.
- **Worked example in every previously-empty `/company/` folder.**
  - `/company/policies/` — three illustrative policy docs (`hitl-external-writes`, `data-retention`, `incident-response`).
  - `/company/memory/cash-forecaster/` — a complete per-agent memory namespace with index and two memory entries.
  - `/company/prompts/cash-forecast-summary.md` — a versioned prompt template wired to the agent and its memory.
  - `/company/events/event-types.yaml` and `/company/events/payloads/cash-forecast-updated.yaml` — typed event registry + per-type payload schema.
  - `/company/runtime/{autonomy-policy,escalation-policy}.yaml` — runtime configuration shaping how autonomy classes and escalations resolve.
  - `/company/dashboards/{executive-overview,finance-overview,platform-overview}.yaml` — three illustrative dashboards referenced from worked module manifests.
  - `/company/automations/{post-period-close,apply-channel-allocation}.yaml` — two automations called by the worked workflows.
  - `/company/playbooks/incident-response.md` — cross-domain playbook.
  - `/company/workflows/incident-response.yaml` — cross-cutting workflow.
  - `/company/tasks/TASK-EXAMPLE-0001.yaml` — example canonical task wiring the incident workflow.
- **Module playbooks for every worked module.** New [`production-deploy.md`](./company/domains/product-operations/platform/playbooks/production-deploy.md) under platform and [`launch-experiment.md`](./company/domains/sales-marketing/growth/playbooks/launch-experiment.md) under growth. Finance already had a playbook; all three worked modules now have full operator-facing procedures.
- **[`/docs/anatomy/`](./docs/anatomy)** — field-by-field deep-dives on `Manifest`, `Agent`, `Workflow` covering required fields, common review failures, and the discipline behind each declaration.
- **[`/docs/scenarios/`](./docs/scenarios)** — three end-to-end operational walkthroughs:
  - `monthly-close.md` — how HITL + dry-run + sync-verification compose on a high-stakes financial action
  - `launching-a-growth-experiment.md` — how the initiative → goal → metric chain drives a weekly cadence
  - `responding-to-an-incident.md` — cross-domain coordination (platform + finance) under SEV-2 conditions
- **[`/docs/faq.md`](./docs/faq.md)** — common questions surfaced as the framework went public.
- **[`/docs/forking.md`](./docs/forking.md)** — explicit guide for adopting the framework as the operating substrate of your own company; what to keep vs. replace, runtime customization, cognition-layer customization, when you've outgrown the seed.
- **ADRs 0002–0004.** Modular monolith ([0002](./docs/adr/0002-modular-monolith.md)), unidirectional mutation ([0003](./docs/adr/0003-unidirectional-mutation.md)), drift gate ([0004](./docs/adr/0004-drift-gate.md)) — the rationale behind the three load-bearing structural decisions, recorded so forks can audit which decisions they've inherited.
- **Mermaid diagrams** in [`docs/architecture.md`](./docs/architecture.md) — the cognition tree and the sync verification protocol now render as visual diagrams on GitHub.

### Added — Skill primitive (now merged from PR #2)

- **Skill primitive (Tier-3 of the knowledge model).** `/schemas/skill.schema.json`, `/templates/skill.yaml`, and five worked skills under `/company/skills/` (`add-module`, `add-agent`, `add-integration`, `resolve-drift`, `sync-verification`).
- **Cross-runtime skill adapter generators.** One canonical YAML per skill produces three machine-readable variants under `/generated/skills/`:
  - `claude/<name>/SKILL.md` — Claude Code skill format
  - `agents-md/<name>.md` — provider-neutral AGENTS.md for Codex, Cursor, Aider, Continue, …
  - `gemini/<name>.gem.json` — Gemini Gems format (also compatible with OpenAI Assistants)
- `/generated/skill-index.json` — flat machine-readable index of every skill with autonomy class, owner, tags, related skills.
- `Agent.skills` field — agents declare which Tier-3 skills they may invoke. Cross-document validation rejects dangling references.
- Two additional CLI tests covering skill schema and reference resolution (12 tests total, up from 8).

### Changed

- `Agent` schema: new optional `skills` field. Backwards compatible — defaults to empty array.
- Architecture doc and glossary updated to define Skill as the canonical Tier-3 artefact.
- README header navigation now includes Anatomy, Scenarios, Forking, FAQ.
- Architecture doc updated to surface the new generators in the registries list.

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
[0.1.0]: https://github.com/gez-scrumsdotcom/Company-as-Code/releases/tag/v0.1.0
