# ADR 0009: The document format is v1alpha1 until it earns more

- **Status:** Proposed
- **Date:** 2026-10-12
- **Deciders:** Lead maintainer
- **Tags:** schemas, versioning, interoperability
- **Proposal:** [PROP-0003](../../company/proposals/PROP-0003-honest-versioning.yaml)

## Context

Every document declared `apiVersion: company-as-code/v1`, and every schema
pinned that value with `const`. In most ecosystems people will recognise,
Kubernetes first among them, `v1` means stable: documents written against it
keep working.

The framework is a 0.x seed. The 0.6 release alone added four primitives and
typed reference edges that turned previously valid documents into errors
(twenty-four of them in the seed, per ADR 0007). That is the right amount of
change for a seed, and it is not what `v1` promises.

The versioning rules also contradicted the files. `schema-migrations.md` said
to "bump the schema's `$id` minor version" after a removal, but no `$id`
carried a version. `interoperability.md` said consumers "pin a version and
resolve it," and there was no version in the identifier to pin.

All of this is free to fix while the repository is private. The day it is
public, the `apiVersion` string and the `$id` URLs become a contract with
people the maintainers have never met.

## Decision

1. **Rename the document version to `company-as-code/v1alpha1`.** The shape of
   documents does not change. Only the string does.
2. **Put the document version in every `$id`**:
   `https://gez-scrumsdotcom.github.io/Company-as-Code/schemas/v1alpha1/<name>.schema.json`.
   The `$id` moves when the document version moves, and at no other time.
3. **Separate the two version numbers explicitly.** The framework release
   (`0.6.0`) and the document version (`v1alpha1`) are different things with
   different promises, written down in
   [`docs/standards/versioning.md`](../standards/versioning.md).
4. **Ship every format change with a migration.** The first one,
   `cli/src/migrations/0001-v1-to-v1alpha1.ts`, performs this rename. It was used
   to migrate this repository's own documents, so the mechanism has been run
   end to end at least once before anyone else depends on it.
5. **Define the ladder now**: alpha, then beta, then stable, with the criteria
   for each step, so the promotion is a decision rather than a drift.

## Consequences

**Good.** The version string tells the truth. Someone evaluating the framework
sees `v1alpha1` and knows what kind of promise they are getting.

**Good.** The `$id` is something a consumer can actually pin, and the standards
now describe what the files do.

**Good.** Breaking changes have a mechanism instead of a paragraph. A fork on
an older format is told to run `cac migrate`, and the migration exists.

**Cost.** Every document in the repository changed one line. This is a one-time
cost paid while the only instance is upstream. Any private fork made before this
change runs `cac migrate --write` once.

**Cost.** The `$id` host is load-bearing in every identifier. The host is
`https://gez-scrumsdotcom.github.io/Company-as-Code/`, the GitHub Pages site of
the upstream repository, which the lead maintainer controls. Moving to another
host is a new document version with a migration, under the rules above.
The `pages` workflow (`.github/workflows/pages.yml`) publishes each schema at
the URL its `$id` names, and the namespace page and JSON-LD context at
`https://gez-scrumsdotcom.github.io/Company-as-Code/ns/`.

## Alternatives considered

**Keep `v1` and version only the `$id`.** Rejected. It fixes the contradiction
in the standards but keeps a public stability promise the schemas do not yet
keep.

**Use the framework release as the document version** (`apiVersion:
company-as-code/0.6`). Rejected. Documents would need rewriting on every
release, including the many releases that change nothing about their shape.

**Wait and rename at 1.0.** Rejected. Renaming after forks exist means every
fork migrates; renaming now means only upstream does.

## Implementation

- `cli/src/version.ts`: the single source of the document version for the CLI
- `cli/src/migrations/0001-v1-to-v1alpha1.ts`: the rename, with a test
- `cli/src/validate.ts`: names outdated documents and points at `cac migrate`
- `schemas/*.schema.json`: versioned `$id`, `const` updated
- `docs/standards/versioning.md`, `docs/standards/schema-migrations.md`

## Links

- [`docs/standards/versioning.md`](../standards/versioning.md)
- [`docs/interoperability.md`](../interoperability.md)
- [`docs/upgrading.md`](../upgrading.md)
