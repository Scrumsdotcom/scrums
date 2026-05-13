# Standard: Documentation

## Rule

Every module ships its manifest, a README, and (when it carries non-trivial logic) at least one playbook. Documentation is stratified into three tiers and never mixed.

## What every new module must include

- `manifest.yaml` — schema-validated declaration
- `README.md` — one-paragraph pointer to the manifest and the worked story
- A playbook for each non-trivial operational procedure the module owns

## Three-tier model

| Tier | Format | Lives in |
|---|---|---|
| **1. Context** | Long-form narrative, history, opinions | ADRs, architecture docs |
| **2. Runtime entry-points** | Numbered steps, inputs, outputs, definition-of-done | Tasks, workflows, playbooks |
| **3. Skills** | Composable reusable expertise | Skill definitions, prompt templates |

Mixing tiers is the most common documentation failure. Context wandering into a runbook makes the runbook unusable in an incident. Runtime steps wandering into context make the context noisy and out of date.

## Plans

Non-trivial work begins with a plan in `/docs/plans/`. Plans carry: status, goal, solution shape, capability check, caveats, phasing, open questions, resume cue.

## ADRs

Architectural decisions land as ADRs in `/docs/adr/`. Numbered sequentially. Status: Proposed → Accepted → (Deprecated | Superseded by ADR-<n>).

## Forbidden

- Tribal-knowledge runbooks ("ask the person who knows")
- Out-of-repo documentation that the runtime depends on
- Documentation that contradicts the manifest (the manifest wins)
