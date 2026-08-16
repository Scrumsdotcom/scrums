# Policy → Control Matrix

Every declared rule in this repository maps to a specific enforcement location. The point of this matrix is to make the **declared-vs-enforced gap impossible to hide**: if a rule is in the docs but missing from this matrix, it isn't enforced.

If you discover a row where the "Enforcement" column says "operator discipline" and you think it should be machine-checked, open an ADR proposing the new check.

| # | Rule | Source | Enforcement |
|---|---|---|---|
| 1 | Every primitive carries `apiVersion: company-as-code/v1` + `kind` discriminator | `/schemas/*.schema.json` (`const` constraints) | **CI**, `cli/src/validate.ts` schema validation, `validate.yml` |
| 2 | No code without a manifest | Spec, `/docs/standards/code-organization.md` | **Generators surface the gap**, modules without manifests don't appear in `dependency-graph.json`. (Stricter check is roadmap item.) |
| 3 | No interface without a declaration | Spec | **CI**, `consumes[].interface` must match producer's `exposes[].interface` (via dependency-graph generator + manifest schema) |
| 4 | Modular monolith: cross-module communication only via declared interfaces | Spec, ADR-0002 | **Generator output**, `/generated/dependency-graph.json` surfaces every cross-module edge for review. Code-level import enforcement is fork-specific. |
| 5 | One writer per field (unidirectional mutation) | Spec, ADR-0003 | **Schema**, `Integration.mutationDirection` enum forbids ambiguous direction; operator discipline for cross-field cases |
| 6 | Canonical IDs are permanent; merges record a tombstone | Spec | **Schema**, `Person.tombstone`, `Organization.lifecycle.mergedInto`; operator discipline for hard-delete prevention at the storage layer |
| 7 | HITL workflows cannot have scheduled triggers | Spec, ADR-0004 | **CI**, `cli/src/validate.ts` cross-doc check + `runtime/src/executor/runner.ts` load-time throw |
| 8 | Live-write requires a prior dry-run audit row in the same correlation | Spec, [`/company/skills/sync-verification.yaml`](../../company/skills/sync-verification.yaml) | **Runtime**, `runtime/src/executor/runner.ts` checks audit log before live execution |
| 9 | Agents with `autonomy: escalated` must declare an `escalation` block | Schema | **CI**, `cli/src/validate.ts` cross-doc check |
| 10 | Standalone agent files are the source of truth; manifest summaries must agree | `/docs/anatomy/agent.md` | **CI**, `cli/src/validate.ts` (manifest-agent linkage check) |
| 11 | `Workflow.trigger.kind=schedule` requires `schedule:`, `kind=event` requires `event:`, `kind=human` requires `actor:` | Schema | **CI**, `/schemas/workflow.schema.json` `allOf if/then` rules |
| 12 | Workflow step kinds (`agent`, `automation`, `human-approval`, `emit-event`, `branch`) require their specific fields | Schema | **CI**, `/schemas/workflow.schema.json` step-level `allOf if/then` rules |
| 13 | Goals reference defined metrics; initiatives reference defined goals + metrics | Schema relationships | **CI**, `cli/src/validate.ts` cross-doc check |
| 14 | Agent skill references must resolve | Schema | **CI**, `cli/src/validate.ts` cross-doc check |
| 15 | Skill `relatedSkills` must resolve | Schema | **CI**, `cli/src/validate.ts` cross-doc check |
| 16 | Automations that `mutates[]` must declare a `dryRun` input | Schema | **CI**, `cli/src/validate.ts` cross-doc check |
| 17 | Dashboard alert routing must resolve to a role in some EscalationPolicy | Schema | **CI**, `cli/src/validate.ts` cross-doc check |
| 18 | `AutonomyPolicy`, `EscalationPolicy`, `EventTypeRegistry` are singletons | Schema | **CI**, `cli/src/validate.ts` cross-doc check |
| 19 | Workflow / Agent `emitsEvent` must be in the `EventTypeRegistry` | Schema | **CI**, `cli/src/validate.ts` cross-doc check + `runtime/src/executor/runner.ts` runtime check |
| 20 | Generated files are deterministic outputs; never hand-merge | ADR-0004 | **CI**, `generate-check.yml` drift gate (drift + orphan detection) |
| 21 | Drift gate: `/generated` must contain *only* files the generators emit | ADR-0004 | **CI**, `cli/src/generate.ts` orphan detection |
| 22 | Generators are idempotent: identical inputs → byte-identical outputs | ADR-0004 | **CI**, `cli/test/generate.test.ts` golden snapshot test |
| 23 | No force-push to protected branches | `/docs/standards/security.md`, ADR-0002 | **GitHub branch protection** (configured outside the repo) |
| 24 | No secrets in the repo | `/SECURITY.md`, `/docs/standards/security.md` | **CI**, `security.yml` (gitleaks) |
| 25 | Dependency vulnerability scanning | `/docs/standards/security.md` | **CI**, `security.yml` (`npm audit`) |
| 26 | Static analysis | `/docs/standards/security.md` | **CI**, `security.yml` (CodeQL) |
| 27 | `npm ci` (lockfile-strict installs in CI) | `/docs/standards/security.md` | **CI**, `validate.yml`, `generate-check.yml` use `npm ci` without fallback |
| 28 | GitHub Actions pinned by SHA, not tag | `/docs/standards/security.md` | **CI**, every action reference in `.github/workflows/*.yml` is `uses: org/repo@<sha>` |
| 29 | Dependency updates arrive grouped and on a cadence matched to the ecosystem | `/docs/standards/security.md` | **Dependabot**, `.github/dependabot.yml` (at most two PRs per ecosystem; majors separated from minor and patch; security updates exempt from grouping, cooldown, and the open-PR limit) |
| 30 | Soft-delete with tombstone is mandatory; hard-delete is forbidden | `/company/policies/data-retention.md` | **Operator discipline**. Schemas support tombstones; storage-layer enforcement is fork-specific |
| 31 | Every agent emits an `auditTopic` | `/docs/standards/observability.md` | **Schema**: `Agent.observability.auditTopic` (not currently required by schema; roadmap item) |
| 32 | Every metric declares ownership, lineage, freshness | Spec | **Schema**, `Metric.owner`, `Metric.lineage`, `Metric.freshness` all required |
| 33 | Every cross-document reference resolves | ADR-0007 | **CI**, `cli/src/refs.ts` resolves every `x-cac-ref` edge; a dangling reference fails `validate` |
| 34 | Every reference field carries an `x-cac-ref` annotation | ADR-0007 | **CI**, `cli/test/validate.test.ts` inventories the edge set; an unannotated addition fails |
| 35 | Every in-scope Requirement is covered by an operating Control | ADR-0006, [`/docs/compliance.md`](../compliance.md) | **CI**, `cli/src/validate.ts` cross-doc check |
| 36 | A Requirement scoped out carries a written rationale | ADR-0006 | **Schema**, `requirement.schema.json` `if/then` requires `scopeRationale` |
| 37 | A Control claiming `operating` declares evidence and a verification date | ADR-0006 | **Schema + CI**, schema requires `lastVerified`; cross-doc check requires an evidence entry |
| 38 | A Control with `method: automated` names a runnable check | ADR-0006 | **Schema**, `control.schema.json` `if/then` requires `verification.check` |
| 39 | A Capability chain terminates in a holder that is not an agent | ADR-0006 | **CI**, `cli/src/validate.ts` cross-doc check |
| 40 | A Capability chain never repeats a holder | ADR-0006 | **CI**, `cli/src/validate.ts` cross-doc check |
| 41 | A high or critical Capability declares an intermediate fallback | ADR-0006 | **Schema**, `capability.schema.json` `if/then` requires `fallback` |
| 42 | A Proposal in a terminal status carries a Ruling that agrees with it | ADR-0006 | **Schema + CI**, schema requires `ruling`; cross-doc check requires agreement |
| 43 | Conserved paths require code-owner review | [`/docs/standards/conserved-core.md`](./conserved-core.md) | **GitHub branch protection** + `.github/CODEOWNERS`; `cac doctor` reports a missing CODEOWNERS as a finding |
| 44 | Every module has an accountable contact | [`/docs/standards/documentation.md`](./documentation.md) | **`cac doctor`**, `ownership` finding |
| 45 | Every autonomous agent is watched by a dashboard or an alert | [`/docs/standards/observability.md`](./observability.md) | **`cac doctor`**, `observability` finding |
| 46 | Relative links in documentation resolve | Repository convention | **`cac doctor`**, `links` warning |
| 47 | A tag only becomes a release if it passes every gate | [`/docs/release-checklist.md`](../release-checklist.md) | **CI**, `.github/workflows/release.yml` re-runs validate, drift, doctor, and both test suites, and refuses a tag that disagrees with the declared versions |
| 48 | Supply-chain posture is measured, not assumed | [`/docs/standards/security.md`](./security.md) | **CI**, `.github/workflows/scorecard.yml` (OpenSSF Scorecard, weekly and on branch-protection changes) |

## How to add a row

1. Open a PR that adds the rule (schema, doc, runtime check, etc.).
2. Add a row to this table in the same PR with the enforcement location.
3. If the rule is "operator discipline" for now, open a follow-up issue to promote it to a machine-checked rule. The roadmap is the destination.

## How to audit

Take any rule from `/docs/standards/`, `/SECURITY.md`, or one of the spec documents. Trace it to a row here. If you can't find one, that's a gap, file it.
