# Standard: Schema migrations

## Rule

Schemas move forward only. Breaking changes require an ADR. Removals follow a deprecation window.

## Process

1. Open an ADR proposing the change. State the motivation, the migration path, and the deprecation timeline.
2. Add the new field / type / enum value alongside the old one. Mark the old one with `deprecatedAt` and `removeAfter`.
3. Update generators and validators to handle both.
4. Migrate existing data through a typed event (event ledger captures the transition).
5. After the deprecation window, remove the old field. Bump the schema's `$id` minor version.

## Forbidden

- Silent removal of fields
- Renaming a field without an alias period
- Changing a field's type in-place
- Skipping the ADR for a breaking change

## Why

Schemas are the contract. Code implements the contract. When the contract changes silently, every downstream consumer breaks at runtime instead of at build time.
