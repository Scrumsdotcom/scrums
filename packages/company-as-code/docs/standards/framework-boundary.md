# Standard: the framework/instance boundary

**Applies to:** upstream and every fork.

## The idea in one paragraph

A company running on Company-as-Code owns its company. It does not own the
framework underneath, the same way an application owns its code but not its
compiler. When both live in one tree with nothing marking the line, every
upstream release turns into a merge conflict, and forks quietly stop taking
releases. This standard draws the line, writes it down where tools can read
it, and makes crossing it visible.

## The four classes

Every file in the repository belongs to exactly one class.

| Class | Who owns it | What an upgrade does | Examples |
|---|---|---|---|
| **framework** | upstream | replaces it | `schemas/`, `cli/`, `runtime/`, `templates/`, `docs/`, `hub/`, `conformance/` |
| **adapt** | upstream starts it, the fork edits it | tells you upstream changed it; never overwrites | `README.md`, `AGENTS.md`, `.github/` |
| **instance** | the fork | never touches it | `company/`, `cac.yaml`, `GOVERNANCE.md`, `docs/governance/`, `CHANGELOG.md` |
| **derived** | nobody; it is regenerated | regenerates it | `generated/`, `framework.lock.json` |

`docs/governance/` is the one instance path inside `docs/`. It describes who
stewards this particular tree, which is not something a fork inherits from
upstream. A fork rewrites it or deletes it.

The authoritative list is `BOUNDARY` in
[`cli/src/boundary.ts`](../../cli/src/boundary.ts). Ask about any path with:

```bash
npx tsx src/index.ts boundary explain schemas/agent.schema.json
```

A file that matches no class fails `cac boundary check`. Upstream must classify
every new top-level path in the same pull request that adds it.

## The two files that make it work

**`cac.yaml`** says what this tree is. Upstream declares `role: upstream`. A
fork declares `role: fork`, a short `namespace`, and the framework release it
is on. Validated against [`schemas/instance.schema.json`](../../schemas/instance.schema.json).

**`framework.lock.json`** records a hash of every framework and adapt file.
Upstream regenerates it with `npm run generate`, and the drift gate fails if it
is stale. A fork never regenerates it: the lock is the fork's record of the
release it came from, and only `cac upgrade` replaces it.

## What a fork may do

- **Edit anything under `company/`.** That is the point.
- **Edit adapt files.** Upgrades will tell you when upstream changed them.
- **Edit a framework file, on purpose.** Add it to `deviations` in `cac.yaml`
  with a reason and, ideally, a decision record under `company/decisions/`.
  A declared deviation is reported, not failed. An upgrade stops at it and asks
  a human.

## What a fork should not do

- **Edit a framework file without declaring it.** `cac boundary check` fails,
  and `cac doctor` warns. The next upgrade would otherwise overwrite the change
  or stall on it, and nobody would remember why it was made.
- **Add files inside framework directories.** They are invisible to upgrades.
  The two common cases have a proper home: fork decisions go in
  `company/decisions/`, and fork hub modules are named `<namespace>-<name>`.
  See [`fork-namespacing.md`](./fork-namespacing.md).

## Checks

| Command | Upstream | Fork |
|---|---|---|
| `npm run generate:check` | fails if the lock is stale | ignores the lock |
| `cac boundary check` | fails on unclassified paths or a stale lock | fails on undeclared edits, deletions, or additions to framework files |
| `cac doctor` | warns on unclassified paths | warns on everything `boundary check` fails on |

## Known limits

- The worked example company lives in upstream's `company/`. A fork replaces
  it. `cac init` declares the fork but does not delete the examples for you;
  that is a deliberate, reviewable commit in the fork.
- The authoring skills in `company/skills/` are framework material living in
  the instance tree. They are copied once at fork time and not upgraded. Moving
  them to a framework-owned path is follow-up work.
