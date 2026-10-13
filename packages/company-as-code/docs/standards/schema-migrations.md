# Standard: Schema migrations

## Rule

Schemas move forward only. Breaking changes require an ADR and ship with a
migration. Removals follow a deprecation window once the format reaches beta.

What counts as breaking, and what each stage of the document version promises,
is in [`versioning.md`](./versioning.md).

## Process

1. Open an ADR proposing the change. State the motivation, the migration path, and the deprecation timeline.
2. Add the new field / type / enum value alongside the old one. Mark the old one with `deprecatedAt` and `removeAfter`.
3. Update generators and validators to handle both.
4. Write the migration in `cli/src/migrations/` with a test, so `cac migrate` moves every existing document forward. Changes to runtime data additionally go through a typed event, so the ledger records the transition.
5. After the deprecation window, remove the old field. If the removal is breaking, it moves the document version forward (for example `v1alpha1` to `v1alpha2`), which changes every schema's `$id`.

## Forbidden

- Silent removal of fields
- Renaming a field without an alias period
- Changing a field's type in-place
- Skipping the ADR for a breaking change
- Shipping a breaking change without its migration

## Why

Schemas are the contract. Code implements the contract. When the contract changes silently, every downstream consumer breaks at runtime instead of at build time.
