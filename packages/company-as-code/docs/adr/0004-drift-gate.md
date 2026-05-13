# ADR 0004: Generated registries + drift gate

- **Status:** Accepted
- **Date:** 2026-05-13
- **Deciders:** Seed maintainers
- **Tags:** generators, ci, correctness

## Context

Manifests, agents, workflows, skills, and the other primitives are walked by generators to produce aggregated views: agent catalogue, flow registry, dependency graph, per-agent context bundles, skill adapters. These generated outputs are consumed by:

- Operators reading the agent catalogue
- Dashboards and observability surfaces
- AI agents (the per-agent context bundles are what an agent **actually reads** at invocation time)
- Cross-runtime skill adapters

The question: where do the generated outputs live, and how do we keep them in sync with the sources?

Three viable approaches:

1. **Generate at runtime.** Walk manifests on every consumption. No committed generated files; the framework computes them when needed.
2. **Generate at build, commit outputs.** The generator runs deterministically; outputs are committed alongside sources. CI verifies they match.
3. **Generate at build, ignore outputs.** Outputs are gitignored; the consumer regenerates locally. Forks see no agent catalogue until they install and run the CLI.

Each has tradeoffs:

| Approach | Runtime cost | Fork-on-first-clone experience | Risk of staleness |
|---|---|---|---|
| Runtime | High | Worst (need full runtime to see anything) | None |
| Commit | None | Best (everything visible immediately) | Mitigated by drift gate |
| Ignore | None | Bad (sources visible, derived views missing) | High |

## Decision

**Generators run at build time, outputs are committed, CI runs a drift gate.**

- Generators are **deterministic** — given the same inputs they produce byte-identical outputs.
- Generated outputs live under `/generated/`, committed alongside their sources.
- CI runs `npm run generate:check` on every PR. If any generated file would change but isn't in the diff, CI fails.
- Hand-merging generated files is forbidden — the resolution path is regeneration.

## Consequences

**Positive**

- A fresh clone carries the resolved view of the whole organization. Forks and reviewers see the agent catalogue, dependency graph, and per-agent context bundles **immediately** without installing anything.
- The drift gate makes manifest-source divergence impossible to ship.
- The audit narrative is more queryable: a PR that adds an agent also visibly modifies the registry. Reviewers see both halves of the change.
- The deterministic property means CI catches not only "you forgot to regenerate" but also "you tried to hand-merge a generated file" (the hand-merge almost always produces output that re-running the generator would not).

**Negative**

- Generated files are part of the working tree, which can produce mechanical merge conflicts when two PRs touch different manifests.
- Generated outputs are large and noisy in `git log`. (Mitigated by clear naming under `/generated/`.)
- The first regeneration after a generator change can be a sweeping diff. (This is a feature — the diff is exactly the impact of the change.)

**Neutral**

- The same property that makes generated files churn under cross-cutting changes is what makes them queryable for impact analysis.

## Alternatives considered

- **Runtime generation only.** Rejected. Forking the repo and not being able to see the cognition tree until you install the CLI is a worse first impression than the framework can afford. The framework is a teaching artefact as much as it is a runtime.
- **Gitignored generated outputs.** Rejected for the same reason, plus the loss of impact-visibility in PR diffs.
- **No drift gate; trust contributors to regenerate.** Rejected. Every framework that relies on contributor discipline for this fails within months.

## Implementation notes

- The generators are in [`/cli/src/generate.ts`](../../cli/src/generate.ts).
- The drift gate is `npm run generate:check`, wired into [`.github/workflows/generate-check.yml`](../../.github/workflows/generate-check.yml).
- Outputs are sorted by stable keys (`stableStringify` in `generate.ts`) so identical inputs produce byte-identical outputs across machines and runs.
- The resolution path for merge conflicts is in the [`resolve-drift`](../../company/skills/resolve-drift.yaml) skill.

## Links

- Spec section: "Generated registries + drift gates"
- Standard: [`/docs/standards/merge-policy.md`](../standards/merge-policy.md)
- Skill: [`resolve-drift`](../../company/skills/resolve-drift.yaml)
- ADR-0001: Record architecture decisions (the decision to use ADRs at all)
