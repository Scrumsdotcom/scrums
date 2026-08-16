# Contributing to Company-as-Code

Thank you for considering a contribution. This document covers how this repository works and what's expected from a pull request.

The short version: **declare before coding, generate deterministically, never hand-merge generated files, and keep one writer per field**.

---

## Before you start

1. **Read the architecture.** [`docs/architecture.md`](./docs/architecture.md) covers the model. [`docs/standards`](./docs/standards) covers the enforceable rules.
2. **Check existing work.** Look in `/docs/plans/` and open issues. A plan may already exist for what you're about to do.
3. **Open an issue first** for any non-trivial change. Small fixes can skip this step.

---

## The contribution workflow

### 1. Plan first (for non-trivial work)

Before writing code for anything substantial, write a plan in `/docs/plans/<short-slug>.md`. Use the template at [`templates/plan.md`](./templates/plan.md). Plans contain:

- **Status banner**: `active` / `parked` / `blocked` / `in-flight` / `complete`
- **Goal**: one or two sentences
- **Solution shape**: intended architecture, boundaries respected
- **Capability check**: what's been verified about systems involved
- **Caveats**: known unknowns, locked-in decisions
- **Phasing**: explicit stages, effort estimates, gating conditions
- **Open questions**
- **Resume cue**: exactly what a fresh operator needs to read to continue

Plans are park-friendly. They survive being put down for weeks and picked up by someone else.

### 2. Declare before coding

A new module starts with its manifest, not its implementation. Every module (at every level of the organizational graph) has a `manifest.yaml` at its root. The manifest is the single declarative source of truth.

A manifest declares:

- **module identity**: name, domain, version, lifecycle status
- **owns**: tables, agents, apps, workflows, dashboards, schemas, policies
- **consumes**: named interfaces from other modules
- **exposes**: interfaces this module offers to others
- **agents**: every autonomous unit, with runtime, schedule, cadence, purpose
- **invariants**: declarative properties that must remain true
- **contacts**: humans accountable for the module

See [`templates/module-manifest.yaml`](./templates/module-manifest.yaml) and the JSON Schema at [`schemas/manifest.schema.json`](./schemas/manifest.schema.json).

**No code without a manifest. No interface without a declaration. No agent without a purpose statement.**

### 3. Run the generators

```bash
npm run validate      # validate every manifest, schema, and registry against JSON Schemas
npm run generate      # walk manifests and emit /generated/*
npm run generate:check  # exit non-zero if generated files would change
```

Generators are **deterministic**. Given the same inputs they produce identical outputs. CI runs `generate:check` on every PR, if your sources changed but the regenerated files aren't in the diff, the PR fails.

### 4. Open the PR

Use the PR template at `.github/PULL_REQUEST_TEMPLATE.md`. It will ask:

- Is there a plan for this change?
- Does every new module have a manifest?
- Are the generated files current?
- Is this a HITL-sensitive surface? If yes, link the policy declaration.
- Does this introduce a new external integration? If yes, what's the canonical-ID mapping?

---

## Hard rules

These are enforced by schema, CI, or merge protection. Don't fight them.

### Modular monolith discipline

- Each module owns its business logic, data access, agents, and invariants.
- Cross-module communication happens **only** through declared interfaces.
- Infrastructure layers contain **zero** business logic.
- State mutation is **unidirectional**.

### Generated files are never hand-merged

When two PRs touch different manifests, they may both regenerate the same registry, producing a mechanical merge conflict in `/generated/`. **Do not hand-merge it.** Resolution:

1. Take either side of the conflict.
2. Re-run `npm run generate`.
3. Commit the deterministic result.

Hand-merging generated files produces a state that's neither side's correct output and will be caught by `generate:check`.

### Migrations are timestamped

Schema migrations use UTC timestamps (`20260301T120000_add_canonical_id.sql`), never sequential numbers (`0042_…`). Sequential names collide silently when multiple contributors merge in parallel.

### No force-push, no secrets, no autonomous writes to irreversible surfaces

- `main` and release branches are protected. Force-push is rejected at the platform level.
- Never commit secrets. Use the project's secret management (declared per integration).
- Writes to external systems with real-world consequences (billing, contracts, communications, public surfaces) are **HITL by default**. Promotion to autonomous requires accumulated reliability evidence + an explicit policy update.

### Dry-run first

Every new write path supports `dryRun=true`. First invocations in any environment go through dry-run. The merge gate asks: "did you run dry-run first."

### Verify before trusting recalled context

A memory or document that names a specific file, function, or flag is a claim that it existed when the claim was written. Before acting on recalled context, verify against current state. If the recalled claim conflicts with current observation, trust the observation and update the recalled claim.

---

## Coding standards

Codified standards live in [`docs/standards`](./docs/standards) and are CI-enforced where possible:

- [`code-organization.md`](./docs/standards/code-organization.md)
- [`schema-migrations.md`](./docs/standards/schema-migrations.md)
- [`branching.md`](./docs/standards/branching.md)
- [`merge-policy.md`](./docs/standards/merge-policy.md)
- [`security.md`](./docs/standards/security.md)
- [`observability.md`](./docs/standards/observability.md)
- [`documentation.md`](./docs/standards/documentation.md)

If you want to change a rule, edit the standard. Changes go through PR review like anything else. **A rule that isn't in the repo is a preference.**

---

## Commit hygiene

- Conventional commits are encouraged but not strictly required.
- Reference the issue or plan in the commit body when relevant.
- Keep commits focused. A commit that touches `manifest.yaml`, `events.schema.json`, and `dashboards/sales.yaml` is doing three things and should be three commits.

---

## Reporting security issues

Don't open a public issue for security reports. See [`SECURITY.md`](./SECURITY.md).

---

## Code of conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md).

---

## License

By contributing, you agree your contributions are licensed under the Apache License 2.0 (see [`LICENSE`](./LICENSE)).
