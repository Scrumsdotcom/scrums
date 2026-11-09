# Anatomy of a Manifest

The `manifest.yaml` at the root of every module is the **declarative contract** for that module. The code implements it. CI rejects code that references undeclared interfaces or agents.

Schema: [`/schemas/manifest.schema.json`](../../schemas/manifest.schema.json). Template: [`/templates/module-manifest.yaml`](../../templates/module-manifest.yaml). Worked examples: [`finance`](../../company/domains/finance-ops/finance/manifest.yaml), [`platform`](../../company/domains/product-operations/platform/manifest.yaml), [`growth`](../../company/domains/sales-marketing/growth/manifest.yaml).

---

## Required fields

### `apiVersion: company-as-code/v1alpha1`

The document format version. **Always** `company-as-code/v1alpha1` for this generation of the framework; the validator pins to it. `alpha` is deliberate: the format can still change between releases, and every change ships with a migration that `cac migrate` applies. See [`versioning.md`](../standards/versioning.md).

### `kind: Manifest`

Discriminator. The CLI loader uses `kind` to route each YAML to the right schema. A manifest without `kind: Manifest` is silently ignored by the loader, which is a recipe for "why isn't my module showing up in the registry."

### `name`

Kebab-case identifier, unique within the parent domain. Pattern: `^[a-z][a-z0-9-]*$`.

The name appears in:
- Generated registries (`/generated/agent-catalogue.json` uses the module path which ends in this name)
- Cross-document references (other modules' `consumes[].from` ends in this name)
- The folder name on disk (must match)

If you rename a module, you're renaming three things at once. There is no "alias period" for module names. Pick well, then commit.

### `domain`

One of: `executive | finance-ops | product-operations | sales-marketing | framework`. Cross-references the spec's three-domain model plus the executive layer plus framework-level utilities.

A module's `domain` does not have to match its filesystem location (e.g. a cross-cutting module can live under `/company/runtime/` with `domain: framework`), but typically does. When they differ, the manifest is the source of truth.

### `lifecycle`

One of: `planning | hardening | stable | agent-ready | deprecated`. Documents the current readiness state of the module:

| Lifecycle | What this signals to operators / agents |
|---|---|
| `planning` | The manifest is being filled in; do not depend on its interfaces yet |
| `hardening` | Interfaces declared; implementation in progress; expect changes |
| `stable` | Implementation matches manifest; safe to consume |
| `agent-ready` | Stable + the per-agent context bundle has been validated against real agent invocations |
| `deprecated` | Don't add new consumers; existing consumers should plan migration |

### `contacts[]`

At least one entry, each with a `role` (required) and optionally `person` or `team`. Every module has a human accountable for it. There is no "we'll figure out ownership later" mode, that's how modules go dark.

The accountable contact appears in escalation paths declared in [`/company/runtime/escalation-policy.yaml`](../../company/runtime/escalation-policy.yaml).

---

## The `owns` block

What this module is canonically responsible for. Empty arrays are valid. A new module may not own any agents yet, but the declaration of zero-ness is itself information.

```yaml
owns:
  tables: []          # canonical tables in the coordination layer
  agents: []          # autonomous units (full declaration lives in /agents/<name>.yaml)
  apps: []             # user-facing apps owned by the module
  workflows: []       # orchestrations
  dashboards: []      # observability surfaces
  schemas: []         # company-level domain schemas
  policies: []        # invariants, HITL declarations
  playbooks: []       # runbooks / SOPs
```

When in doubt about ownership: a thing belongs to exactly one module. Multiple modules claiming the same artefact is a code smell, extract a parent or rename.

---

## The `consumes` block

Named interfaces this module **reads** from other modules. Every cross-module read passes through here.

```yaml
consumes:
  - interface: ledger-summary
    from: company/domains/finance-ops/finance
    usage: P&L summary for the executive roll-up
```

The `from:` value is the **module path** (the directory of the producing manifest). The `interface:` value must appear in the producer's `exposes[].interface`.

CI enforces the discipline: if the producer doesn't expose what the consumer declares it consumes, validation passes (the producer might not exist yet) but the dependency-graph generator surfaces an unresolved edge. When the producer does exist, mismatched names are caught immediately.

---

## The `exposes` block

Named interfaces this module **offers** to others.

```yaml
exposes:
  - interface: ledger-summary
    stability: experimental    # experimental | stable | deprecated
    description: P&L, cash, runway summary consumed by the finance-ops executive
```

The `stability:` value drives consumer expectations:

| Stability | Consumer contract |
|---|---|
| `experimental` | Interface may change in any release. Pin and update; expect work. |
| `stable` | Changes only in major versions with an ADR + deprecation window. |
| `deprecated` | Consumers should migrate. Removal follows a declared horizon (`deprecatedAt`, `removeAfter`). |

A module's `exposes` is its **public API surface** to the rest of the organization. Treat additions like any API change.

---

## The `agents` block (inline summary)

Inline summary of autonomous units the module owns. The **standalone agent file** at `<module>/agents/<name>.yaml` is the source of truth; this block is the manifest's at-a-glance view. The CLI's agent-catalogue generator combines both.

```yaml
agents:
  - name: cash-forecaster
    purpose: Produce a rolling 13-week cash forecast.
    runtime: scheduled-job
    schedule: "0 7 * * *"
    cadence: daily
    autonomy: autonomous
    primaryUsers: [cfo, finance-lead]
    outputs: [cash-forecast]
```

If a manifest's inline `agents` entry says `autonomy: escalated`, the standalone agent file must include an `escalation:` block. The CLI's cross-document validator enforces this on the standalone file (which is the source of truth).

---

## The `invariants` block

Declarative properties that must remain true. These are **assertions about the module**, not aspirations.

Each invariant is a single sentence. Good invariants:

- "All ledger writes pass through a dry-run before live mutation."
- "No autonomous writeback to external accounting systems."
- "Canonical IDs for invoices are permanent; merges produce tombstones."

Bad invariants:

- ❌ "Tests pass." (Universal, not module-specific)
- ❌ "The team aims to ship weekly." (Aspirational, not assertional)
- ❌ "Should be performant." (Unfalsifiable)

The runtime references invariants in audit refusals: when a check fails, the rejection cites the invariant by text.

---

## The `links` block

Free-form pointer table for related artefacts that don't fit cleanly into other fields. Common keys:

- `dashboard`: pointer to the module's primary dashboard
- `playbook`: pointer to the canonical operational procedure
- `runbook`: when distinct from playbook
- `slackChannel`: for forks that use one chat integration

Keys are not enforced; values are URLs or repo-relative paths.

---

## Common review failures

These are the things to catch in PR review:

1. **Empty `contacts[]`**: schema requires `minItems: 1`. If you see this, the PR is incomplete.
2. **Generic `purpose`**: "Owns the finance stuff." Rewrite. The purpose should distinguish this module from every other module.
3. **`consumes[]` pointing at a `from:` that doesn't exist**: validates (the loader doesn't enforce module presence yet), but the dependency-graph generator will show the dangling edge.
4. **Inline `agents` summary mismatching the standalone file**: the standalone file wins; fix the manifest summary.
5. **`lifecycle: stable` on day one**: almost always wrong. New modules start `planning` or `hardening`.
6. **Invariants written as goals**: see "Bad invariants" above.

---

## Related

- Standard: [`/docs/standards/code-organization.md`](../standards/code-organization.md)
- Skill: [`add-module`](../../company/skills/add-module.yaml)
- Architecture: [`/docs/architecture.md`](../architecture.md)
