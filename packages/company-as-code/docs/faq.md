# FAQ

Questions that come up enough to be worth answering once, publicly. If your question isn't here, open an issue using the [feature request template](../.github/ISSUE_TEMPLATE/feature_request.md).

---

## What is this, really?

Company-as-Code is a **framework + reference implementation** for treating a company as a versioned, observable, orchestrated system. The framework is the JSON Schemas in `/schemas`, the discipline codified in `/docs/standards`, and the spec at `/docs/spec`. The reference implementation is the TypeScript CLI in `/cli`. Forks pick which parts they keep and which they replace.

## Is this an "AI startup" project?

No. AI is **first-class** but not the point. The framework is equally useful for an organization with zero AI agents, the discipline (manifests, declared interfaces, canonical IDs, unidirectional mutation, HITL, audit + event ledger) is what's load-bearing. AI happens to slot in naturally because the runtime treats human and AI execution as the same kind of thing.

## Can I use this without writing TypeScript?

Yes. The framework is the **schemas and the discipline**, not the CLI. Port the generators to Go, Python, Rust, or anything else. The test is whether `npm run generate:check` and your reimplementation produce byte-identical output. We will gladly link to community reimplementations.

## Why a modular monolith and not microservices?

Most companies don't have the operational maturity to run microservices well, and the spec optimizes for **operational clarity over architectural fashion**. The modular monolith discipline gives you the boundaries you'd want from microservices (declared interfaces, owned data, invariants per module) without the network costs of having actually split them. When a module genuinely needs to be its own service, the manifest already declared the interface; the migration is mechanical.

## Why is `/generated/` committed?

So that a fresh clone carries the resolved view of the whole organization without anyone needing to install or run anything. Forks who immediately fork-and-skim should see the agent catalogue, dependency graph, and per-agent context bundles **immediately**. CI's drift gate keeps generated outputs honest.

## What's the difference between an Agent, an Automation, and a Workflow?

- **Agent**: reasons. Observes, plans, decides, escalates. Typically AI-backed. Declared per module under `agents/`.
- **Automation**: executes. Takes typed inputs, produces typed outputs, has well-known failure modes. Deterministic. Declared under `/company/automations/`.
- **Workflow**: orchestrates. Sequences agent invocations, automation runs, human approvals, and event emissions.

A workflow step of `kind: agent` calls an agent. A step of `kind: dry-run` or `kind: live-write` calls an automation. A step of `kind: human-approval` blocks until an operator records a decision.

## Why is `human-gated` the default for external writes?

Because the cost of a wrong-but-fast autonomous write (sent the wrong email, posted the wrong invoice, deployed the wrong build) is much higher than the cost of a slower-because-human write. The framework can promote a path to autonomous after evidence accumulates. See [`/company/policies/hitl-external-writes.md`](../company/policies/hitl-external-writes.md).

## How do I add support for a vendor that isn't already declared?

Use the [`add-integration`](../company/skills/add-integration.yaml) skill. The short version: declare an `Integration` manifest with a vendor-neutral name, point `canonicalIdMapping` at the entities the vendor's IDs map to, declare `hitlRequiredFor` for any irreversible operations, reference secrets via `secretRef` (never literally). No vendor name lives in business logic.

## How do I add support for an AI runtime that isn't already declared?

Skills are the answer. Each skill in `/company/skills/` generates three runtime adapters: Claude `SKILL.md`, provider-neutral `AGENTS.md`, Gemini Gem JSON. To add a fourth runtime (LangChain hub, custom IDE rules, anything), write one small function in `cli/src/generate.ts` that converts the canonical Skill YAML to your target format. The canonical YAML doesn't change.

## What happens if two PRs both touch the same generated file?

You get a mechanical merge conflict in `/generated/`. **Do not hand-merge it.** Take either side, run `npm run generate`, commit the result. The drift gate validates that the regenerated output is correct. See the [`resolve-drift`](../company/skills/resolve-drift.yaml) skill.

## Why is force-push to main forbidden even when "safe"?

Because the policy is uniform. A force-push that's safe today and a force-push that destroys history tomorrow look the same in branch protection logs. Disallowing both removes the judgment call.

## Why is hard-delete forbidden?

Because audit trails are load-bearing. A soft-delete with a tombstone is recoverable; a hard-delete is not. The cost of carrying tombstones forever is small; the cost of losing audit history once is very high.

## What is the relationship between Company-as-Code and Scrums.com?

Company-as-Code is the **open-source operating-system pattern** behind Scrums.com's view of how modern, AI-native organizations should be designed, observed, and run. Scrums.com's commercial **Software Engineering Orchestration Platform (SEOP)** is a managed implementation of this pattern for software engineering organizations specifically. Both projects share the framework; the platform adds the runtime, the hosted observability, and the integrations.

## Can I use this at my company without buying anything from Scrums.com?

Yes. The Apache 2.0 license includes a patent grant. Fork, adapt, deploy. Sell derivative products. The framework is permissively licensed and that is not going to change.

## Do I have to model compliance to use this?

No. Requirements and Controls are two primitives among two dozen, and a fork
with none of them validates fine. The coverage gate only fires on requirements
you have declared as in-scope.

The reason to reach for them is that they turn an obligation into something CI
can fail on. If you are heading toward a certification, or you already have
controls that live in a spreadsheet, moving them here means the spreadsheet
cannot silently stop matching the systems. See [`/docs/compliance.md`](./compliance.md).

## Why can a Capability's fallback chain never end in an agent?

Because an agent can be unavailable in ways a person cannot. Credentials
expire, a rate limit bites, a refactor deletes the declaration, a provider has
an outage. A chain exists to answer "and then what," so its last link has to be
something that cannot itself disappear: a person, a team, or a role.

The check is enforced at validation, not left to review.

## What's the roadmap?

[`/docs/roadmap.md`](./roadmap.md), which tracks shipped, in flight, considered,
and explicitly declined, with the reasoning for each. It is more honest about
what has been declined than most roadmaps, which is the useful part.

## Where do I report a security issue?

[`SECURITY.md`](../SECURITY.md). Do not open a public issue.
