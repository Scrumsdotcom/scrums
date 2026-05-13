# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

When the schema for a canonical primitive changes in a backwards-incompatible way, that's a **major** bump. New optional fields or new primitives are **minor**. Tooling and documentation fixes are **patch**.

---

## [Unreleased]

### Added

- **Skill primitive (Tier-3 of the knowledge model).** New `/schemas/skill.schema.json`, `/templates/skill.yaml`, and five worked skills under `/company/skills/` (`add-module`, `add-agent`, `add-integration`, `resolve-drift`, `sync-verification`).
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
- README "AI-native by construction" section now calls out the one-skill-many-runtimes model.

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
