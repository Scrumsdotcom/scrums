# Upgrading a fork

How a company running on Company-as-Code takes a new framework release
without merging it.

> **Status: early.** The commands below work and are tested, but no external
> fork has used them across a real release yet. Run them on a branch, read the
> plan before writing, and report anything surprising.

## The short version

```bash
# 1. Get the release you are moving to, next to your fork
git clone --depth 1 --branch v0.7.0 https://github.com/gez-scrumsdotcom/Company-as-Code ../cac-release

# 2. Preview, then apply, the framework files
npx tsx cli/src/index.ts upgrade --from ../cac-release
npx tsx cli/src/index.ts upgrade --from ../cac-release --write

# 3. Install the new CLI, then preview and apply document migrations
npm --prefix cli install && npm --prefix runtime install
npx tsx cli/src/index.ts migrate
npx tsx cli/src/index.ts migrate --write

# 4. Prove it
npm run generate && npm run validate && npm test && npm run boundary
```

Every step that writes is a dry run first. Nothing under `company/` is copied
from upstream, ever.

## What the upgrade does to each file

The upgrade compares three things for every framework file: what your fork
received (your `framework.lock.json`), what upstream ships now (the release's
lock), and what is on disk in your fork.

| You changed it? | Upstream changed it? | Result |
|---|---|---|
| No | No | Nothing happens |
| No | Yes | **update**: upstream's version replaces yours |
| No | Deleted it | **remove** |
| n/a | Added it | **add** |
| Yes | No | **keep**: your version stays |
| Yes | Yes | **CONFLICT**: the upgrade stops and names the file |

Adapt files (`README.md`, `AGENTS.md`, `.github/`) are never overwritten. If
upstream changed one, the plan lists it under **review** so you can carry over
what you want.

## Resolving a conflict

A conflict means you and upstream both changed the same framework file. You
have two honest choices:

1. **Take upstream's version.** Copy the file from the release, and drop your
   change. If your change was worth keeping, propose it upstream.
2. **Keep yours, on purpose.** List the file under `deviations` in `cac.yaml`
   with a reason, and record the decision in `company/decisions/`. The upgrade
   will stop at this file every time upstream changes it, which is the point.

Then re-run the upgrade. If you need to move forward before resolving
everything, `--write --allow-conflicts` applies the rest and leaves each
conflicted file as it was. `npm run boundary` will list them until they are
resolved.

## Why migrations are a separate step

The new release's CLI knows how to migrate documents to the new format; your
current CLI does not. So `upgrade` replaces the framework files, including the
CLI, and `migrate` runs afterwards with the new one. Migrations are text
transforms, so your comments and formatting survive.

## How this maps to the sync verification protocol

An upgrade mutates your repository, so it follows the same five steps as any
other state-mutating sync ([`sync-verification`](../company/skills/sync-verification.yaml)):

| Step | In an upgrade |
|---|---|
| 1. Baseline | `npm run boundary` is clean before you start, and your lock names your current release |
| 2. Dry run | `upgrade` and `migrate` without `--write` print the full plan |
| 3. Confirm counts | the plan ends with counts of updates, adds, removes, and conflicts; check them against the release notes |
| 4. Live | the same commands with `--write`, on a branch |
| 5. Re-verify | `generate`, `validate`, `test`, and `boundary` all pass; review the diff in a pull request |

## Related

- [`docs/standards/framework-boundary.md`](./standards/framework-boundary.md): which files are framework, adapt, instance, or derived
- [`docs/standards/versioning.md`](./standards/versioning.md): what a release and an `apiVersion` each promise
- [`docs/forking.md`](./forking.md): starting a fork
