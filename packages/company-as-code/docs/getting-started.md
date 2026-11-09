# Getting started

A walkthrough from clone to first module to first agent. Assumes Node 22 or newer.

## 1. Clone and install

```bash
git clone https://github.com/gez-scrumsdotcom/Company-as-Code.git
cd Company-as-Code
cd cli && npm install && cd ..
```

The CLI lives in `/cli`. The framework is the specs in `/schemas` and `/docs`. The CLI is one reference implementation, feel free to port the generators to Go, Python, or Rust.

## 2. Validate what's there

```bash
npm run validate
```

You should see something like `✓ validate: 78 document(s) OK across 24 primitive(s); 119 typed reference(s) resolved.` (exact counts move as the seed evolves). The seed ships with worked examples in three modules (finance, platform, growth) plus the executive layer, skills, events, and runtime policies.

## 3. Generate the registries

```bash
npm run generate
```

This writes 90 files under `/generated`, including:

- `agent-catalogue.json`, `flow-registry.json`, `dependency-graph.json`, `domain-model.json`, the core registries
- `company-graph.json`: every canonical entity and every typed edge between them
- `control-matrix.json` and `capability-map.json`: compliance coverage and ownership chains
- `context.jsonld`: the semantic mapping for external consumers
- `context-bundles/`: one per-agent context bundle
- `sdk/typescript/` and `sdk/python/`, typed SDKs projected from `/schemas`
- `skills/`: per-runtime skill adapters (Claude, AGENTS.md, Gemini)
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
cp templates/module-manifest.yaml company/domains/finance-ops/legal/manifest.yaml
```

Open the file. Fill in:

- `name`: kebab-case identifier (e.g. `legal`)
- `purpose`: one sentence
- `lifecycle`: start with `planning`
- `owns`: what tables, agents, workflows, dashboards, schemas this module is canonically responsible for
- `contacts`: at minimum, an accountable contact

Validate:

```bash
npm run validate
```

## 6. Add an agent

Copy:

```bash
mkdir -p company/domains/finance-ops/legal/agents
cp templates/agent.yaml company/domains/finance-ops/legal/agents/contract-expiry-watch.yaml
```

Fill in `name`, `module`, `purpose`, `runtime`, `cadence`, `autonomy`. Declare the agent in your module's manifest under `agents:`:

```yaml
agents:
  - name: contract-expiry-watch
    purpose: Flag contracts inside their notice window against the canonical contract record nightly.
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
mkdir -p company/domains/finance-ops/legal/workflows
cp templates/workflow.yaml company/domains/finance-ops/legal/workflows/contract-renewal.yaml
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
git add company/domains/finance-ops/legal/ generated/
git commit -m "Add legal module with contract-expiry-watch and contract-renewal workflow"
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
directory.) The execute run is **dry-run by default**. No live writes
happen. It prints a correlation ID; read the audit narrative back with:

```bash
npm run host -- audit <correlationId>
```

See [`/runtime/README.md`](../runtime/README.md) for live-write gating, HITL
approvals, tracing, and snapshots.

## 11. Ask the repository how it is doing

```bash
npm run doctor
```

`validate` answers "is everything well-formed and does every declared edge
resolve." Doctor answers "is this repository still healthy," which is a
different and non-binary question: rotted documentation links, controls nobody
has verified in a long time, modules with nobody accountable, autonomous agents
that no dashboard or alert watches. Findings fail; warnings report and pass.
See [`/docs/doctor.md`](./doctor.md).

You're done.

---

## Patterns you'll use a lot

- **A new write path**: ship it with a dry-run-required step and a baseline/re-verify pair. See [`/templates/workflow.yaml`](../templates/workflow.yaml).
- **An escalating agent**: set `autonomy: escalated` and declare an `escalation` block with `threshold` and `to`.
- **A goal → metric chain**: write the metric first (`/templates/metric.yaml`), then the goal (`/templates/goal.yaml`) referencing the metric ID, then optionally an initiative referencing the goal.
- **A new external system**: declare an `Integration` (`/schemas/integration.schema.json`), don't add it as a hardcoded reference in business logic.
- **A new reusable technique**: write a skill at `/company/skills/<name>.yaml`. `npm run generate` emits three machine-readable adapters, `SKILL.md` for Claude, `<name>.md` for any tool that reads an `AGENTS.md`, `<name>.gem.json` for Gemini. One source, every runtime.
- **A new obligation**: write the `Requirement` first, then a `Control` that names it under `implements`. An in-scope requirement with no operating control fails validation, so write them in that order or the build tells you off. See [`/docs/compliance.md`](./compliance.md).
- **A function that must survive its owner**: write a `Capability` with a primary owner, an ordered fallback chain, and a final fallback that is a person, team, or role. Be honest in `delivers`. See [`/docs/capabilities.md`](./capabilities.md).
- **A change to the spec, a standard, a schema, or a policy**: that is the conserved core. Write a `Proposal` at `/company/proposals/` with the reason, evidence, validation, and rollback, and get a ruling. See [`/docs/standards/conserved-core.md`](./standards/conserved-core.md).

## When something breaks

- **Schema error**: read the error path. The CLI prints `instancePath` for each violation.
- **Drift on a PR**: run `npm run generate`, commit the regenerated files, never hand-merge.
- **Dangling reference**: the error names the file, the field, the value, and the kinds the field is allowed to point at. Either the target does not exist yet or the ID has a typo. Nothing else can cause it.
- **Confusing manifest**: read [`/docs/architecture.md`](./architecture.md) and the spec at [`/docs/spec/company-as-code-spec.md`](./spec/company-as-code-spec.md).
