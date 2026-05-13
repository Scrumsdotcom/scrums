# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

When the schema for a canonical primitive changes in a backwards-incompatible way, that's a **major** bump. New optional fields or new primitives are **minor**. Tooling and documentation fixes are **patch**.

---

## [Unreleased]

### Added

- Example canonical primitives: one `Integration`, one `Organization`, one `Person` — proving every schema has at least one worked example document.
- Deterministic per-agent context-bundle generator (`/generated/context-bundles/<module>__<agent>.json`), emitting one bundle per agent with resolved inputs, outputs, tools, observability surfaces, and HITL constraints.
- CLI unit tests via vitest covering schema violations and the cross-document discipline checks (HITL on schedule, escalated agent without escalation block, dangling goal/metric references).

### Changed

- README clone URL, getting-started clone URL, and CHANGELOG compare link all point at the real repository (`gez-scrumsdotcom/Company-as-Code`).
- `cli/package.json` no longer exposes an unused `bin` entry pointing at a non-existent build artifact.

---

## [0.1.0] — 2026-05-13

### Added

- Initial seed repository.
- Canonical specification at `docs/spec/company-as-code-spec.md`.
- JSON Schemas for canonical primitives: manifest, task, agent, workflow, initiative, goal, metric, event, audit-record, interface, organization, person, integration.
- Canonical `/company` directory structure across three domains (finance-ops, product-operations, sales-marketing) plus executive and top-level support directories.
- Authoring templates for manifests, agents, workflows, tasks, initiatives, goals, metrics, playbooks, plans, and ADRs.
- Worked examples in finance, platform, and growth modules.
- Reference TypeScript CLI with manifest validation and deterministic generators (agent catalogue, flow registry, dependency graph, domain model).
- CI workflows for schema validation and drift detection.
- Architecture documentation, getting-started guide, codified standards, glossary, and ADR 0001 bootstrapping the ADR process.

[Unreleased]: https://github.com/gez-scrumsdotcom/Company-as-Code/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/gez-scrumsdotcom/Company-as-Code/releases/tag/v0.1.0
