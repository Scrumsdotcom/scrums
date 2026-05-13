---
name: resolve-drift
description: "Recover when `npm run generate:check` fails on a PR. Regenerate, never hand-merge generated files."
---

# Resolve drift

Use this skill when the drift gate (`npm run generate:check`) fails. The fix
is **always regeneration**, never hand-editing.

## Why hand-merging is forbidden

Generated files are deterministic outputs of the manifest graph. When two PRs
touch different manifests, they may both regenerate the same registry, producing
a mechanical merge conflict. Hand-merging almost always produces a state that
is neither side's correct output — which the drift gate immediately catches on
the next push.

The resolution path is **regeneration**, every time:

## Steps

1. **Sync your branch with main** (so you're regenerating from current truth).
   ```bash
   git fetch origin
   git rebase origin/main          # or merge, per your branch policy
   ```

2. **Resolve any conflicts in source files first** — manifests, agents,
   workflows, schemas. Generated files come last.

3. **For generated-file conflicts: take either side, then regenerate.**
   ```bash
   git checkout --theirs generated/        # or --ours; doesn't matter
   git add generated/
   cd cli && npm run generate
   ```
   The regenerator's deterministic output replaces whatever you took. If both
   sides were wrong, regeneration produces the correct result.

4. **Re-stage and verify locally.**
   ```bash
   git add ../generated/
   npm run generate:check
   ```
   Must exit zero.

5. **Commit.** Use a focused commit message: `Regenerate after rebase` or
   `Resolve registry conflict via regeneration` is plenty.

6. **Push.** CI's drift gate now passes.

## Definition of done

- [ ] `npm run generate:check` is green locally
- [ ] Source-file conflicts resolved as actual edits, not regeneration
- [ ] Generated-file conflicts resolved by regeneration
- [ ] CI drift gate is green on the latest push

## Failure handling

- **Drift persists after regeneration** — you likely have an inconsistent manifest:
  a `consumes` entry pointing at an interface that doesn't exist in the producer's
  `exposes`, or a workflow with `hitl: true` but a `schedule` trigger. Run
  `npm run validate` first; the cross-document discipline checks will surface
  the real issue.
- **Regeneration produces wildly different output than expected** — diff against
  the most recent main; if the change is large, you may have inadvertently
  edited a manifest. Review the source-file diff with `git diff origin/main -- '*.yaml'`.

## Related

- Skill: `add-module`, `add-agent` — most drift originates from manifest edits.
- Standard: `/docs/standards/merge-policy.md` — the policy this skill enforces.
