# Getting started

A walkthrough from clone to first module to first agent. Assumes Node 20+.

## 1. Clone and install

```bash
git clone https://github.com/gez-scrumsdotcom/Company-as-Code.git
cd Company-as-Code
cd cli && npm install && cd ..
```

The CLI lives in `/cli`. The framework is the specs in `/schemas` and `/docs`. The CLI is one reference implementation — feel free to port the generators to Go, Python, or Rust.

## 2. Validate what's there

```bash
npm run validate
```

You should see something like `✓ validate: 46 document(s) OK across 20 primitive(s).` (exact counts move as the seed evolves). The seed ships with worked examples in three modules — finance, platform, growth — plus the executive layer, skills, events, and runtime policies.

## 3. Generate the registries

```bash
npm run generate
```

This writes ~78 files under `/generated`, including:

- `agent-catalogue.json`, `flow-registry.json`, `dependency-graph.json`, `domain-model.json` — the core registries
- `context-bundles/` — one per-agent context bundle
- `sdk/typescript/` and `sdk/python/` — typed SDKs projected from `/schemas`
- `skills/` — per-runtime skill adapters (Claude, AGENTS.md, Gemini)
- `skill-index.json`, `hub-index.json`, `cognition-graph.json`

Open a few. They are deterministic outputs of the documents under `/company` and the schemas under `/schemas`.

## 4. Run the drift gate

```bash
npm run generate:check
```

This is what CI runs. If you edit a manifest and forget to regenerate, this will fail.

## 5. Write your first module

Copy the template:

```bash
cp templates/module-manifest.yaml company/domains/finance-ops/people/manifest.yaml
```

Open the file. Fill in:

- `name` — kebab-case identifier (e.g. `people`)
- `purpose` — one sentence
- `lifecycle` — start with `planning`
- `owns` — what tables, agents, workflows, dashboards, schemas this module is canonically responsible for
- `contacts` — at minimum, an accountable contact

Validate:

```bash
npm run validate
```

## 6. Add an agent

Copy:

```bash
mkdir -p company/domains/finance-ops/people/agents
cp templates/agent.yaml company/domains/finance-ops/people/agents/onboarding-checker.yaml
```

Fill in `name`, `module`, `purpose`, `runtime`, `cadence`, `autonomy`. Declare the agent in your module's manifest under `agents:`:

```yaml
agents:
  - name: onboarding-checker
    purpose: Verify onboarding completion against the people canonical record nightly.
    runtime: scheduled-job
    schedule: "0 4 * * *"
    cadence: daily
    autonomy: autonomous
```

Validate:

```bash
npm run validate
```

## 7. Add a workflow

Copy:

```bash
mkdir -p company/domains/finance-ops/people/workflows
cp templates/workflow.yaml company/domains/finance-ops/people/workflows/new-hire-setup.yaml
```

Fill in steps. If the workflow writes to an external system, include a `dry-run` step before any `live-write` step. If the workflow as a whole is human-gated, set `hitl: true` and use a `trigger.kind` other than `schedule`.

Validate:

```bash
npm run validate
```

## 8. Regenerate and check

```bash
npm run generate
npm run generate:check
```

Your new module, agent, and workflow now appear in the generated registries. The drift gate passes because you regenerated.

## 9. Commit

```bash
git add company/domains/finance-ops/people/ generated/
git commit -m "Add people module with onboarding-checker and new-hire-setup workflow"
```

## 10. Run a workflow through the runtime host

The payoff: the same YAML you just validated is executable. The reference
runtime host loads the manifest graph and runs workflows dry-run-first,
writing every step to an audit ledger.

```bash
cd runtime && npm install && cd ..
npm run host -- load --repo ..
npm run host -- execute month-end-close \
  --repo .. \
  --input period=2026-04 \
  --trigger-actor people:finance-lead \
  --auto-approve
```

(`--repo ..` because the host script runs with `/runtime` as its working
directory.) The execute run is **dry-run by default** — no live writes
happen. It prints a correlation ID; read the audit narrative back with:

```bash
npm run host -- audit <correlationId>
```

See [`/runtime/README.md`](../runtime/README.md) for live-write gating, HITL
approvals, tracing, and snapshots.

You're done.

---

## Patterns you'll use a lot

- **A new write path**: ship it with a dry-run-required step and a baseline/re-verify pair. See [`/templates/workflow.yaml`](../templates/workflow.yaml).
- **An escalating agent**: set `autonomy: escalated` and declare an `escalation` block with `threshold` and `to`.
- **A goal → metric chain**: write the metric first (`/templates/metric.yaml`), then the goal (`/templates/goal.yaml`) referencing the metric ID, then optionally an initiative referencing the goal.
- **A new external system**: declare an `Integration` (`/schemas/integration.schema.json`), don't add it as a hardcoded reference in business logic.
- **A new reusable technique**: write a skill at `/company/skills/<name>.yaml`. `npm run generate` emits three machine-readable adapters — `SKILL.md` for Claude, `<name>.md` for Codex/Cursor/AGENTS.md, `<name>.gem.json` for Gemini. One source, every runtime.

## When something breaks

- **Schema error**: read the error path. The CLI prints `instancePath` for each violation.
- **Drift on a PR**: run `npm run generate`, commit the regenerated files, never hand-merge.
- **Confusing manifest**: read [`/docs/architecture.md`](./architecture.md) and the spec at [`/docs/spec/company-as-code-spec.md`](./spec/company-as-code-spec.md).
