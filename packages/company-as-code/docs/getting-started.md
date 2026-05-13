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

You should see something like `✓ validate: 24 document(s) OK across 11 primitive(s).` The seed ships with worked examples in three modules — finance, platform, growth.

## 3. Generate the registries

```bash
npm run generate
```

This writes:

- `/generated/agent-catalogue.json`
- `/generated/flow-registry.json`
- `/generated/dependency-graph.json`
- `/generated/domain-model.json`

Open them. They are deterministic outputs of the manifests under `/company`.

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

You're done.

---

## Patterns you'll use a lot

- **A new write path**: ship it with a dry-run-required step and a baseline/re-verify pair. See [`/templates/workflow.yaml`](../templates/workflow.yaml).
- **An escalating agent**: set `autonomy: escalated` and declare an `escalation` block with `threshold` and `to`.
- **A goal → metric chain**: write the metric first (`/templates/metric.yaml`), then the goal (`/templates/goal.yaml`) referencing the metric ID, then optionally an initiative referencing the goal.
- **A new external system**: declare an `Integration` (`/schemas/integration.schema.json`), don't add it as a hardcoded reference in business logic.

## When something breaks

- **Schema error**: read the error path. The CLI prints `instancePath` for each violation.
- **Drift on a PR**: run `npm run generate`, commit the regenerated files, never hand-merge.
- **Confusing manifest**: read [`/docs/architecture.md`](./architecture.md) and the spec at [`/docs/spec/company-as-code-spec.md`](./spec/company-as-code-spec.md).
