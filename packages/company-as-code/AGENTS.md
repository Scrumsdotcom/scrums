# Agent Instructions — Company-as-Code

This file is the entry point for any AI coding agent, AI operator, or autonomous unit operating on this repository — Claude Code, Codex, Cursor, Aider, Continue, Gemini, OpenAI Assistants, and any future runtime that consumes an `AGENTS.md`.

If you are an AI agent reading this file, treat the linked content as authoritative and ground every action in it.

---

## What this repo is

Company-as-Code is an **open-source operating system for AI-native organizations**. The repository is the executable organizational graph. Every primitive — module, agent, workflow, task, initiative, goal, metric, integration, skill — has a JSON Schema, a worked example, and a place in the cognition tree.

When something is unclear, the order of authority is:

1. **`docs/spec/company-as-code-spec.md`** — the master specification. Source of authority. When this conflicts with anything else, this wins until the spec is updated through a PR with an ADR.
2. **`docs/architecture.md`** — the operational framing derived from the spec.
3. **`docs/standards/`** — codified, enforceable rules.
4. **`schemas/*.schema.json`** — the contract; code implements it.
5. **`docs/adr/`** — Architecture Decision Records; superseded ADRs remain for historical context.

---

## Hard rules

These are enforced by schema, CI, or merge protection. Do not fight them.

1. **No code without a manifest.** Every module declares `owns`, `consumes`, `exposes`, `agents`, `invariants`, `contacts` in `manifest.yaml` before any code is written under that folder.
2. **No interface without a declaration.** Cross-module communication happens only through interfaces declared in the producer's `exposes` block.
3. **No hand-merging of generated files.** Files under `/generated/` are deterministic outputs. Conflicts are resolved by regeneration, never by hand-editing.
4. **No autonomous writes to irreversible surfaces.** Writes to external systems (billing, contracts, communications, public surfaces) are HITL by default. The `human-gated` autonomy class is enforced — schedules on `human-gated` workflows fail validation.
5. **Dry-run before live.** Every new write path supports `dryRun=true`. First invocations default to dry-run. The sync verification protocol (see [`skill: sync-verification`](./company/skills/sync-verification.yaml)) applies to every state-mutating sync.
6. **No vendor names in domain logic.** Integrations are pluggable. Vendor names live under `Integration.system` as a label, never in business code.
7. **Verify before trusting recalled context.** Memory and prior answers are claims until checked against current state.

---

## Where to find things

| You need | Look here |
|---|---|
| The spec / source of authority | [`docs/spec/company-as-code-spec.md`](./docs/spec/company-as-code-spec.md) |
| The architectural framing | [`docs/architecture.md`](./docs/architecture.md) |
| Onboarding for humans / agents | [`docs/getting-started.md`](./docs/getting-started.md) |
| Defined terms | [`docs/glossary.md`](./docs/glossary.md) |
| Codified standards | [`docs/standards/`](./docs/standards) |
| Architecture decisions | [`docs/adr/`](./docs/adr) |
| Anatomy of each primitive | [`docs/anatomy/`](./docs/anatomy) |
| End-to-end scenarios | [`docs/scenarios/`](./docs/scenarios) |
| FAQ | [`docs/faq.md`](./docs/faq.md) |
| Forking guide | [`docs/forking.md`](./docs/forking.md) |
| Roadmap (shipped / in flight / considered / declined) | [`docs/roadmap.md`](./docs/roadmap.md) |
| Canonical schemas | [`schemas/`](./schemas) |
| Authoring templates | [`templates/`](./templates) |
| Worked module examples | [`company/domains/finance-ops/finance/`](./company/domains/finance-ops/finance), [`company/domains/product-operations/platform/`](./company/domains/product-operations/platform), [`company/domains/sales-marketing/growth/`](./company/domains/sales-marketing/growth) |
| Tier-3 skills (reusable techniques) | [`company/skills/`](./company/skills) |
| Generated registries | [`generated/`](./generated) |
| Reference runtime host (execute workflows + persist audit/events) | [`runtime/`](./runtime) |

---

## Skills you can invoke

Every Tier-3 skill in [`/company/skills/`](./company/skills) generates a per-runtime adapter under `/generated/skills/`. If you are running in:

- **Claude Code / Claude Agent SDK** — read `/generated/skills/claude/<name>/SKILL.md`
- **Codex / Cursor / Aider / Continue / any AGENTS.md-aware tool** — read `/generated/skills/agents-md/<name>.md`
- **Gemini Gems / OpenAI Assistants** — read `/generated/skills/gemini/<name>.gem.json`

Currently authored skills:

| Skill | Use when |
|---|---|
| [`add-module`](./company/skills/add-module.yaml) | Bootstrapping a new module from scratch |
| [`add-agent`](./company/skills/add-agent.yaml) | Adding an autonomous unit to an existing module |
| [`add-integration`](./company/skills/add-integration.yaml) | Wiring a new external system via canonical IDs |
| [`resolve-drift`](./company/skills/resolve-drift.yaml) | Recovering when the drift gate fails on a PR |
| [`sync-verification`](./company/skills/sync-verification.yaml) | Applying the 5-step protocol to a state-mutating sync |

---

## The validation + regeneration loop

Every change to a manifest, agent, workflow, skill, or any other canonical primitive must pass this loop locally before pushing:

```bash
cd cli && npm install                # once
npm run validate                     # schema + cross-document discipline
npm run generate                     # regenerate /generated/
npm run generate:check               # drift gate (CI runs this)
npm test                             # unit tests
```

CI runs `validate.yml` and `generate-check.yml` on every PR. If you push without regenerating, CI fails on the drift gate.

---

## Definition of done for any change

- [ ] All affected manifests are valid (`npm run validate`)
- [ ] Generated registries are up to date (`npm run generate:check`)
- [ ] Tests pass (`npm test`)
- [ ] If a new module: it has a manifest with at least one accountable contact
- [ ] If a new interface: declared in the owning module's `exposes`
- [ ] If a new write path: dry-run support is in place; sync verification protocol is documented
- [ ] If a new agent: autonomy class is the most restrictive valid choice; `escalated` agents carry an `escalation` block
- [ ] If a new skill: the canonical YAML is in `/company/skills/`; do not hand-edit the generated `SKILL.md` / `AGENTS.md` / `gem.json` outputs

---

## Anti-patterns

These are failure modes the framework has been deliberately shaped to prevent. Do not introduce them.

- **Direct imports across module boundaries.** Go through declared interfaces.
- **Hardcoded vendor names** in domain logic. The framework is vendor-neutral by construction.
- **Mirroring an external system's full state** into the coordination layer. Coordinate, don't replicate.
- **Bidirectional sync without a documented conflict-resolution protocol.** Treat circular sync as a defect.
- **Free-text events in the typed event ledger.** Enum-controlled types only.
- **Hard-deleting records.** Soft-delete with a tombstone; record merges with a canonical "merged into" pointer.
- **Hand-merging generated files.** Always regenerate.
- **Force-pushing protected branches.** Branch protection is set; do not attempt to override.

---

## When this file conflicts with anything

This file is a navigation aid, not the source of authority. If it contradicts the spec, the spec wins. If it contradicts a current standard or ADR, the standard or ADR wins. Update this file via PR when something material changes.
