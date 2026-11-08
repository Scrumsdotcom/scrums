# Standard: versioning

**Applies to:** every schema, every canonical document, every release.

## Two version numbers, two promises

Company-as-Code carries two version numbers. They answer different questions,
and mixing them up is how a project ends up promising stability it does not
have.

| | Example | Answers | Moves when |
|---|---|---|---|
| **Framework release** | `0.7.0` in `package.json` and `cac.yaml` | "Which code, schemas, and docs am I running?" | Every release |
| **Document version** | `company-as-code/v1alpha1` in every document's `apiVersion` | "What shape are my documents?" | Only when the shape of documents changes in a way that needs a migration |

A fork upgrades its **release** with `cac upgrade`. It moves its **documents**
to a new document version with `cac migrate`.

## The stability ladder

The document version says how much the format is allowed to change underneath
you.

| Stage | Name | What may change | What you get when it does |
|---|---|---|---|
| Alpha | `v1alpha1`, `v1alpha2`, ... | Anything, between releases | A migration that `cac migrate` applies, and an ADR saying why |
| Beta | `v1beta1`, ... | Additive changes freely; breaking changes after one release of deprecation | A deprecation warning first, then a migration |
| Stable | `v1` | Additive changes only | Breaking changes wait for `v2`, and `v1` keeps validating for a published window |

**Today the format is `v1alpha1`.** The framework is a 0.x seed, the schemas
still change in breaking ways, and the version says so. Moving to beta is a
decision recorded in an ADR, made when the schemas have gone a full release
cycle without a breaking change and at least one fork outside upstream has
upgraded across a release.

## Schema identifiers

Every schema's `$id` carries the document version:

```
https://gez-scrumsdotcom.github.io/Company-as-Code/schemas/v1alpha1/agent.schema.json
```

The `$id` changes when, and only when, the document version changes. Field
level changes within one document version do not touch it. The exact bytes of
a schema at a given release are pinned by the release tag and recorded, with a
hash, in `framework.lock.json`.

## Every format change ships with its migration

A change that would make an existing valid document invalid is a breaking
change, at any stage. It ships, in the same pull request, with:

1. **An ADR** saying what changed and why.
2. **A migration** in `cli/src/migrations/`, numbered sequentially, that moves
   existing documents forward. Migrations are text transforms, so comments and
   formatting survive. A released migration is never edited; mistakes are fixed
   by the next one.
3. **A new document version**, if the change is breaking. During alpha this
   means `v1alphaN` to `v1alphaN+1`.
4. **A test** showing the migration turns a document valid under the old
   version into one valid under the new.

`cac validate` names any document on an older version and points at
`cac migrate`.

## Release numbers

Framework releases follow semantic versioning, with the 0.x reading that
semantic versioning itself allows: before 1.0.0, a breaking change is a
**minor** release.

- A breaking change to document shape, which always ships with a migration
  and a new document version, is **minor** while the framework is 0.x and
  **major** after 1.0.0.
- New optional fields or new primitives are **minor**.
- Tooling and documentation fixes are **patch**.

The framework reaches 1.0.0 no earlier than the document version reaches
stable.

## What counts as compatible

Within one document version, these are allowed without a migration:

- adding an optional property
- widening an enum
- relaxing a pattern or a minimum
- adding a `$def`

Everything else, including renaming a field, removing one, narrowing an enum,
or making an optional field required, is breaking.

## Forbidden

- Changing what a document version means after release, without a migration.
- Editing a released migration.
- Promoting the format to beta or stable without an ADR.
- Using the framework release number as the document version, or the reverse.

## Related

- [`schema-migrations.md`](./schema-migrations.md): the step-by-step process for a single schema change
- [`docs/upgrading.md`](../upgrading.md): how a fork takes a release and runs migrations
- [ADR 0009](../adr/0009-honest-versioning.md): why the format is `v1alpha1`
