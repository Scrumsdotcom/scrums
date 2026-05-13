# Standard: Branching

## Rule

Work happens on feature branches; main is protected. Branch names are descriptive and kebab-case.

## Naming

- `feat/<short-description>` — new feature
- `fix/<short-description>` — bug fix
- `chore/<short-description>` — maintenance, deps, CI
- `docs/<short-description>` — documentation only
- `adr/<NNNN>-<short>` — ADR proposal

## Lifecycle

1. Branch from `main`.
2. Push early, push often. CI runs on every push.
3. Open a PR using [`/.github/PULL_REQUEST_TEMPLATE.md`](../../.github/PULL_REQUEST_TEMPLATE.md).
4. Address review feedback; never force-push to a shared review branch unless the reviewer signs off on it.
5. Merge via "Squash and merge" or "Rebase and merge". No merge commits on `main`.

## Forbidden

- Force-push to `main` (history rewriting attack vector)
- Long-lived branches (> 30 days) without an attached plan
- Branches that mix unrelated changes
