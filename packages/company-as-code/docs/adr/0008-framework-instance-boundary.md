# ADR 0008: A declared boundary between the framework and the instance

- **Status:** Accepted
- **Date:** 2026-10-12
- **Deciders:** Lead maintainer
- **Tags:** forking, upgrades, boundary, namespacing
- **Proposals:** [PROP-0002](../../company/proposals/PROP-0002-framework-instance-boundary.yaml), [PROP-0004](../../company/proposals/PROP-0004-fork-namespacing.yaml)

## Context

The repository is both a framework and a worked example of a company running
on it, and the two share one tree. That was fine while the only instance was
upstream. It stops being fine the day someone forks.

`docs/forking.md` tells a fork which paths to keep and which to replace in a
twenty-row table, then tells it to "merge upstream monthly." In practice that
merge collides in three places: the example company the fork already replaced,
the generated registries, and any framework file the fork touched. Nothing in
the tree records which framework release a fork is on or which framework files
it changed, so every conflict has to be reasoned about from scratch.

Forks that find upstream merges expensive stop taking them. A framework whose
forks are frozen on old releases has no ecosystem, only copies.

Two smaller collisions follow from the same missing line. The fork guide tells
forks to number their own ADRs from `0010`; upstream is at `0007` and will reach
`0010` within a few releases. Hub modules authored by a fork sit in the same
directory as upstream's, under names upstream may later use.

## Decision

1. **Classify every path.** Each file is `framework`, `adapt`, `instance`, or
   `derived`. The classes are declared once, in `cli/src/boundary.ts`, and
   documented in [`docs/standards/framework-boundary.md`](../standards/framework-boundary.md).
   A path with no class is an error.
2. **Declare the instance.** `cac.yaml` at the root says whether the tree is
   upstream or a fork, carries the fork's namespace, pins the framework release,
   and lists deliberate deviations.
3. **Publish a lock.** Upstream regenerates `framework.lock.json`, a hash of
   every framework and adapt file, as part of `npm run generate`. The drift gate
   covers it. A fork keeps the lock it received as the record of its release.
4. **Check the boundary.** `cac boundary check` fails a fork on undeclared
   edits, deletions, or additions to framework files, and fails upstream on a
   stale lock or an unclassified path. `cac doctor` reports the same as
   warnings.
5. **Give forks their own places.** Fork decisions live in `company/decisions/`.
   Fork hub modules are named `<namespace>-<name>`, and the boundary treats
   them as instance files.
6. **Upgrade through the lock.** `cac upgrade` compares the fork's lock, the
   new upstream lock, and the fork's files, and replaces only the framework files
   the fork has not touched. `cac migrate` then moves instance documents to the
   new document version. Both are dry runs by default.

## Consequences

**Good.** A fork can answer "what did we change in the framework, and why?"
with one command, and the answer is a list of declared deviations rather than
a diff archaeology exercise.

**Good.** Upgrades stop being merges. Files the fork never touched are
replaced; files it did touch stop the upgrade with a named reason.

**Good.** Namespace collisions are prevented by construction for the two
surfaces where forks write next to upstream.

**Cost.** Every upstream change to a framework file changes the lock, so
upstream contributors run `npm run generate` more often. This is the same
discipline the generated registries already require, and conflicts in the
lock are resolved by regenerating, never by hand.

**Cost.** The CLI test suite now runs files sequentially. Several suites write
scratch files into the shared `/company` tree while others regenerate from it;
the extra time spent hashing the framework made that race visible.

**Limit.** The worked example company stays in upstream's `company/`, because
module identity is the module's path and every reference in the examples
spells that path. Moving the examples is a separate, larger change. A fork
replaces them in its own reviewable commit.

## Alternatives considered

**Move the framework into a package forks install.** Cleaner in the long run,
and still possible later. Rejected for now: the schemas, docs, and runtime
would all need publishing pipelines before a single fork exists, and the lock
gives the same upgrade guarantees inside one tree.

**Keep the table in `docs/forking.md` and improve its wording.** Rejected. A
table cannot fail a build, and the problem is precisely that nothing notices
when a fork crosses the line.

**Use git subtrees or submodules for the framework.** Rejected. Both make the
common case, a fork reading and grepping the schemas next to its company,
harder, and both push merge reasoning onto every fork.

## Implementation

- `cli/src/boundary.ts`: classes, lock, `boundary check`, `boundary explain`, `init`
- `cli/src/upgrade.ts`: `cac upgrade`
- `cli/src/migrate.ts` and `cli/src/migrations/`: `cac migrate`
- `cli/src/generate.ts`: publishes the lock in upstream
- `cli/src/doctor.ts`: boundary health
- `schemas/instance.schema.json`, `cac.yaml`, `framework.lock.json`

## Links

- [`docs/standards/framework-boundary.md`](../standards/framework-boundary.md)
- [`docs/standards/fork-namespacing.md`](../standards/fork-namespacing.md)
- [`docs/upgrading.md`](../upgrading.md)
- [`docs/forking.md`](../forking.md)
