# Decisions

This instance's own architecture decisions.

Upstream's decisions, the ones about the framework itself, live in
[`/docs/adr/`](../../docs/adr). Decisions about this company live here, numbered
independently, so a fork's numbering never collides with upstream's.

Upstream has no instance decisions yet, so this folder is empty apart from this
file. In a fork, it is usually the first folder to fill up.

## Adding one

1. Copy [`/templates/adr.md`](../../templates/adr.md) to `NNNN-short-title.md`,
   using the next number in this folder.
2. Fill in Context, Decision, Consequences, Alternatives.
3. If the decision changes a framework file, also list that file under
   `deviations` in `/cac.yaml` and point `decision` at your record.

See [`docs/standards/fork-namespacing.md`](../../docs/standards/fork-namespacing.md).
