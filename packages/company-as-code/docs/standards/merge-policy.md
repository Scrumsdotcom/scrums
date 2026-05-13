# Standard: Merge policy

## Rule

Every change goes through PR. The drift gate must be green. Generated files are never hand-merged.

## Required checks before merge

- [ ] `npm run validate` — passes
- [ ] `npm run generate:check` — passes (no drift)
- [ ] At least one human review
- [ ] If a new module: manifest is in the same PR
- [ ] If a new interface: declared in the producer's `exposes`, referenced from any consumer's `consumes`
- [ ] If a new write path: dry-run support is in place, sync verification protocol documented in the playbook

## Generated-file conflicts

When two PRs each touch different manifests, they may both regenerate the same registry, producing a mechanical merge conflict.

**Do not hand-merge.**

The resolution path:

1. Take either side of the conflict.
2. Re-run `npm run generate`.
3. Commit the deterministic result.

The drift gate exists to catch hand-merges that produce wrong-but-plausible output.

## Forbidden

- Hand-merging generated files
- Bypassing the drift gate
- Merging without at least one reviewer
- Force-merging through branch protection ("merge anyway")
