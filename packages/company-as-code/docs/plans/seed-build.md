# Plan: Initial Seed Build

**Status:** `complete`
**Owner:** Gerald Neves
**Last touched:** 2026-05-13
**Resume cue:** Seed is built. `npm run validate` and `npm run generate:check` are green. The plan is preserved here as a historical record of what shipped.

---

## Goal

Build out the complete Company-as-Code seed repository from the master specification at [`docs/spec/company-as-code-spec.md`](../spec/company-as-code-spec.md). Ship: foundation files, JSON Schemas for every canonical primitive, full `/company` directory scaffold, authoring templates, worked examples across three domains, a working TypeScript reference CLI with validation + generators, CI drift gates, and complete documentation.

## Solution shape

- **Foundation files** at repo root, README, LICENSE, CONTRIBUTING, CHANGELOG, SECURITY, CODE_OF_CONDUCT, .gitignore.
- **Master spec** preserved verbatim at `docs/spec/company-as-code-spec.md`, the source of authority for all downstream artefacts.
- **JSON Schemas** at `/schemas/*.schema.json`, one schema per canonical primitive, enforced by CI.
- **Canonical directory tree** under `/company/`, three domains, executive layer, top-level support directories. Each substantial folder has a README; modules with logic carry a `manifest.yaml`.
- **Authoring templates** at `/templates/`, annotated starting points for each primitive.
- **Worked examples** in three modules (finance, platform, growth), real manifests, agents, workflows wired through.
- **Reference CLI** in TypeScript at `/cli/`, deterministic generators, validation, drift-check mode for CI.
- **CI workflows** under `.github/`, schema validation + drift gate.
- **Documentation** under `/docs/`, architecture, getting started, codified standards, glossary, ADRs.

Boundaries respected:

- Framework-level schemas/templates live at `/schemas` and `/templates`; company-level customization lives at `/company/schemas` and `/company/templates`. Forks rarely edit framework-level files.
- Generators are deterministic; their outputs go to `/generated/` and are committed. CI fails on drift.
- No vendor names anywhere. Integrations are pluggable.

## Capability check

- Repo is at `/workspaces/Company-as-Code` on `main`, clean before the build started.
- License is already Apache 2.0 (chosen).
- CLI language locked as **TypeScript / Node**.
- Scope locked as **full seed with working examples**.
- Memory hygiene: feedback memory `feedback_no_coauthor.md` says **do not add `Co-Authored-By` trailers** to any commit on this repo. Honor that on the final commit.

## Caveats

- The `/generated/` directory does not yet exist. It will be created by the first run of `npm run generate` once the CLI is in place. Until then, CI's drift-check will be a no-op.
- The README references `https://github.com/your-org/company-as-code.git` as a placeholder clone URL. Update it once the project has a permanent home.
- The spec mentions sub-domain placeholders are valid: i.e., folders without manifests are allowed. The scaffold deliberately leaves many domain sub-folders without manifests; that's not an oversight.
- The CHANGELOG's `[Unreleased]` link points to a placeholder org. Fix when the repo is moved.

## What's done

Files written and on disk:

- `LICENSE` (Apache 2.0, pre-existing)
- `README.md`: full positioning, layout, quick start, vendor-neutrality, AI-native section
- `CONTRIBUTING.md`: workflow, hard rules, plan-first, hand-merge prohibition, force-push prohibition
- `CHANGELOG.md`: Unreleased section enumerating planned seed contents
- `SECURITY.md`: reporting policy + operational security posture summary
- `.gitignore`: Node, env files, secrets, IDE, OS; explicit note that `/generated/` is NOT ignored
- `docs/spec/company-as-code-spec.md`: full master specification preserved verbatim
- `docs/plans/seed-build.md`: this file

Task tracker state at parking time:

- Tasks #1, #2, #3 completed (README, CONTRIBUTING, spec file)
- Task #4 in progress (foundation files: `.gitignore`, `CHANGELOG`, `SECURITY` done; **`CODE_OF_CONDUCT.md` still pending**)
- Tasks #5 through #29 pending

## Phasing

Each phase is a small chunk that can be picked up independently. The order matters: schemas before scaffolds, scaffolds before examples, examples before CLI verification.

### Phase 0: Finish foundation _(complete)_

- [x] `README.md`
- [x] `CONTRIBUTING.md`
- [x] `.gitignore`
- [x] `CHANGELOG.md`
- [x] `SECURITY.md`
- [x] `docs/spec/company-as-code-spec.md`
- [x] `CODE_OF_CONDUCT.md`

### Phase 1: JSON Schemas (`/schemas/`)  _(complete)_

- [x] `manifest.schema.json`
- [x] `task.schema.json`
- [x] `agent.schema.json`
- [x] `workflow.schema.json`
- [x] `initiative.schema.json`
- [x] `goal.schema.json`
- [x] `metric.schema.json`
- [x] `event.schema.json`
- [x] `audit-record.schema.json`
- [x] `interface.schema.json`
- [x] `organization.schema.json`
- [x] `person.schema.json`
- [x] `integration.schema.json`

### Phase 2: Canonical directory scaffold (`/company/`)  _(complete)_

- [x] Executive layer (ceo, finance-ops, product-operations, sales-marketing) with READMEs + manifests
- [x] All three domains scaffolded with sub-module READMEs
- [x] Top-level support dirs with READMEs

### Phase 3: Authoring templates (`/templates/`)  _(complete)_

- [x] `module-manifest.yaml`, `agent.yaml`, `workflow.yaml`, `task.yaml`
- [x] `initiative.yaml`, `goal.yaml`, `metric.yaml`, `playbook.md`, `plan.md`, `adr.md`

### Phase 4: Worked examples  _(complete)_

- [x] `finance-ops/finance`, manifest + cash-forecaster + month-end-close workflow + playbook + INIT/GOAL/METRIC chain
- [x] `product-operations/platform`, manifest + 3 agents (autonomous / escalated / human-gated) + production-deploy workflow + 3 sub-cognition manifests
- [x] `sales-marketing/growth`, manifest + growth-experiment-runner + customer-acquisition workflow + INIT/GOAL/METRIC chain

### Phase 5: Reference CLI (`/cli/`)  _(complete)_

- [x] `package.json`, `tsconfig.json`, npm scripts
- [x] Ajv-based validator (schema + cross-document discipline checks)
- [x] Generators: agent-catalogue, flow-registry, dependency-graph, domain-model
- [x] `--check` mode wired to drift gate

### Phase 6: CI (`.github/`)  _(complete)_

- [x] `.github/workflows/validate.yml`
- [x] `.github/workflows/generate-check.yml`
- [x] `.github/PULL_REQUEST_TEMPLATE.md`
- [x] `.github/ISSUE_TEMPLATE/{bug_report,feature_request}.md`

### Phase 7: Documentation (`/docs/`)  _(complete)_

- [x] `architecture.md`
- [x] `getting-started.md`
- [x] `standards/{code-organization,schema-migrations,branching,merge-policy,security,observability,documentation}.md`
- [x] `glossary.md`
- [x] `adr/0001-record-architecture-decisions.md`

### Phase 8: Verify + commit  _(complete)_

- [x] `cd cli && npm install`, 33 packages
- [x] `npm run validate`, `✓ 24 document(s) OK across 11 primitive(s).`
- [x] `npm run generate`, wrote 4 files to `/generated`
- [x] `npm run generate:check`, `✓ /generated is in sync.`
- [x] Single commit of the seed, no `Co-Authored-By` trailer.

## Open questions

- Permanent GitHub org / repo URL for the final positioning. README and CHANGELOG currently use `your-org/company-as-code` as placeholder.
- Whether to ship a Dockerfile or devcontainer for the reference CLI. Out of scope for v0; can be added later.
- Whether the `/generated/` outputs should include a `_GENERATED` header banner or rely on file-naming conventions alone. Current direction: file-naming (`/generated/*` is the convention; banners get out of date).

## Resume cue (verbose)

Open `docs/plans/seed-build.md`. The "What's done" section is the ground truth, verify with `git status` and `ls`. Then start at **Phase 0's unchecked item** (`CODE_OF_CONDUCT.md`) and proceed through phases in order. The task tracker in the running session has the same items numbered #4 through #29; if resuming in a new session, re-create the task list from the phasing above.

Critical constraints to honor on the final commit:

- Apache 2.0 license is already in place.
- Do **not** add `Co-Authored-By: Claude` or any AI attribution to the commit message. This is durable user preference saved in agent memory.
- The CI drift gate (`npm run generate:check`) must pass before commit. If it doesn't, run `npm run generate` and commit the regenerated files.
