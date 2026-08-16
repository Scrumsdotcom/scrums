<!-- PR Title: brief, imperative. e.g. "Add growth-experiment-runner agent" -->

## Summary

Two or three sentences. What changes; why now.

## Modules touched

- [ ] `<module path>`
- [ ] …

## Manifest / generator / HITL checklist

- [ ] Every new or modified module has an up-to-date `manifest.yaml`.
- [ ] Every new interface is declared in the owning module's `exposes` block.
- [ ] Every cross-module read appears in the consumer's `consumes` block.
- [ ] Every new agent declares **purpose**, **autonomy**, and **cadence**.
- [ ] `autonomy: escalated` agents declare an `escalation` block (threshold + recipient).
- [ ] Workflows that write to external systems include a **dry-run step** before any live write.
- [ ] Workflows marked `hitl: true` do not have a `schedule` trigger.
- [ ] `npm run validate` passes locally.
- [ ] `npm run generate:check` passes locally (no drift).
- [ ] If generated files changed, they were regenerated, **never hand-merged**.

## ADR / plan link

If this is non-trivial, link the plan or ADR.

## Risk / blast radius

- Reversibility: easy / hard / impossible without recovery
- HITL surfaces affected: yes / no
- Generated registries affected: yes / no
