# Forking Company-as-Code

This guide is for anyone forking the repo to operationalize **their** company. If you only want to read the framework, the rest of `/docs` is enough; if you want to deploy it as the operational substrate for a real organization, read this.

---

## What you keep vs. replace

Company-as-Code separates **framework-level** content (rarely edited in a fork) from **company-level** content (always edited).

| Path | Edit in a fork? |
|---|---|
| `/schemas/*.schema.json` | Rarely — these are the framework contract |
| `/templates/*.yaml`, `/templates/*.md` | Rarely — these are framework-level authoring starters |
| `/cli/` | Optional — you can use as-is, or port to your stack |
| `/runtime/` | Optional — reference runtime host. Replace pluggable invokers (`AgentInvoker`, `AutomationInvoker`, `ApprovalProvider`) with your real implementations, or write your own runtime against the same schemas |
| `/docs/spec/company-as-code-spec.md` | Treat as upstream — don't edit; track upstream changes |
| `/docs/standards/`, `/docs/architecture.md` | Edit if your fork changes a standard (record via ADR) |
| `/docs/adr/` | Add your own ADRs as `0010-…`, `0011-…` (leave 0001-0004 in place as bootstrap history) |
| `/company/**` | **Yes** — this is your company; replace everything under here |
| `/company/templates/` | **Yes** — your in-house starters |
| `/AGENTS.md`, `/README.md` | Adapt the README; keep AGENTS.md largely as-is and add your fork-specific section at the bottom |
| `/MAINTAINERS.md`, `/CODE_OF_CONDUCT.md` | Replace with your own |
| `/SECURITY.md` | Replace reporting channels |
| `/CHANGELOG.md` | Start your own; keep the upstream history visible if you want |
| `/LICENSE` | Keep Apache 2.0 unless you have a clear reason and a competent license review |

---

## The minimum viable fork

The smallest fork that actually operationalizes something:

1. **Replace `/company/`.** Delete the worked examples and the `/company/skills/` examples; build your real first module — usually whichever team most needs operational discipline. Use the [`add-module`](../company/skills/add-module.yaml) skill.
2. **Declare your integrations.** Use the [`add-integration`](../company/skills/add-integration.yaml) skill. Start with read-only mappings.
3. **Wire one workflow end-to-end.** Pick your highest-stakes operational sync. Apply the [`sync-verification`](../company/skills/sync-verification.yaml) protocol. Ship it `human-gated`.
4. **Run `npm run validate`, `npm run generate`, `npm run generate:check`.** Commit the regenerated outputs.
5. **Set up CI** by copying `.github/workflows/{validate,generate-check}.yml` into your fork (already there if you forked).
6. **Lock the merge method** to squash-only in repo settings.

That's the minimum. Everything else is incremental.

---

## How to absorb upstream changes

Track the upstream `gez-scrumsdotcom/Company-as-Code` repo. When a framework-level change lands upstream:

- Schema additions: usually safe to take wholesale. Re-validate your `/company/` content; new optional fields are backwards compatible.
- Schema deletions: never silent — they ship with an ADR and a deprecation window. Take action within the window.
- Generator changes: regenerate `/generated/` and commit; the drift gate will tell you if anything broke.
- Standards changes: read the ADR; adapt your fork's standards if needed.

A reasonable cadence is to merge upstream monthly and have a regular reviewer for the framework diff.

---

## Customizing the runtime

The framework specifies contracts; the **runtime is your choice**. To deploy Company-as-Code into an actual organization, you'll need:

- **An event ledger.** Anything that accepts typed events keyed by canonical ID. Common choices: a relational database with a `events` table, an event-streaming platform, or a managed service.
- **An audit log.** Same; can be the same table or a separate one. Audit rows are loose-schema; events are tight-schema.
- **A scheduler / job runner.** For autonomous and escalated agents.
- **An approval surface.** UI or CLI where human-gated approvals are captured. Approvals must produce an audit row with the approver's canonical Person ID.
- **A secret store.** Integration manifests reference secrets via `secretRef` — point at your secret manager.
- **A paging integration.** For the `escalation-policy.yaml` channel routing.
- **An observability stack.** Dashboards consume metrics with declared lineage. Pick your visualization layer.

None of these are baked in. Pick what fits your shop.

---

## Customizing the cognition layer

Skills generate Claude `SKILL.md`, AGENTS.md, and Gemini Gem JSON. To support a fourth runtime:

1. Open `cli/src/generate.ts`.
2. Add a new function `skillAsXyz(skill)` modeled on `skillAsClaude`.
3. Add it to the `skillAdapters()` array.
4. Run `npm run generate` and commit the new outputs under `/generated/skills/xyz/`.
5. Update [`/company/skills/README.md`](../company/skills/README.md) to list the new adapter.

That's the whole change. No schema bump; no breaking change.

---

## What forks should NOT do

- **Don't edit `/docs/spec/company-as-code-spec.md`.** If you need to disagree with the spec for your fork, record the deviation as an ADR in your fork; don't rewrite the upstream.
- **Don't add vendor names to domain logic.** The vendor lives under `Integration.system` as a label. Doing otherwise undoes the most valuable property of the framework.
- **Don't widen autonomy classes without an ADR.** Demoting `autonomous` → `human-gated` is free; promoting is gated. Treat it like a security boundary, because it is.
- **Don't disable the drift gate.** It's the cheapest correctness check the framework provides. Disabling it for "just this PR" is how every "but we never had this problem before" incident starts.

---

## When you've outgrown the seed

Signals that you've gone deep enough on the framework that the next step is **your** patterns, not the reference implementation:

- You've added your own canonical primitives with their own schemas
- You've shipped a runtime that other forks would benefit from
- You've published a vendor adapter that the community wants to consume

When that happens, consider contributing back upstream — the framework is permissively licensed but a vibrant community is what makes a reference implementation valuable. See [`MAINTAINERS.md`](../MAINTAINERS.md) for the contribution path.

---

## Related

- [`/AGENTS.md`](../AGENTS.md) — the root navigation for AI agents and operators
- [`/docs/getting-started.md`](./getting-started.md) — your first manifest, your first agent
- [`/docs/anatomy/`](./anatomy) — field-by-field for the primitives
- [`/docs/scenarios/`](./scenarios) — three end-to-end walkthroughs
