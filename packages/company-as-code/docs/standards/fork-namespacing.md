# Standard: fork namespacing

**Applies to:** every fork. Upstream follows it trivially, with the namespace `cac`.

## The problem

Some things a fork creates sit next to things upstream creates. If both pick
the same name or number, the next upgrade has two files claiming one identity,
and someone has to decide which one wins. That decision is always made in a
hurry, by whoever is running the upgrade.

The fix is cheap if it is made before the first fork exists, and expensive
after: renaming identifiers that other documents reference is a migration.

## The rule

**Everything a fork creates either lives under `company/` or carries the
fork's namespace.**

The namespace is declared once, in `cac.yaml`, as 2 to 16 lowercase letters or
digits (for example `acme`). `cac init` sets it.

## Surface by surface

| Surface | Where upstream's live | Where a fork's live | Enforced by |
|---|---|---|---|
| Architecture decisions | `docs/adr/NNNN-*.md` | `company/decisions/NNNN-*.md`, numbered independently | `cac boundary check` fails a fork that adds a file to `docs/adr/` |
| Hub modules | `hub/modules/<name>/` | `hub/modules/<namespace>-<name>/` | `cac boundary check` fails a fork hub module without the prefix |
| Proposals | `company/proposals/` | `company/proposals/` | Nothing needed, see below |
| Event types, canonical IDs, module paths | `company/**` | `company/**` | Nothing needed, see below |

### Why proposals and event types need no namespace

They live under `company/`, and `company/` is instance-owned: upgrades never
copy upstream's `company/` into a fork. Upstream's `PROP-0002` and a fork's
`PROP-0002` never meet in one tree, so they cannot collide.

The one place they could meet is a fork proposing a change back upstream. The
fork's proposal is then rewritten as a new upstream proposal with the next
upstream number, and links to the fork's original. Numbers are cheap; history
is not, so the original stays where it was.

### Why decisions get their own folder instead of a prefix

A fork's architectural decisions are about the fork's company. Upstream's are
about the framework. They answer different questions for different readers,
so they belong in different places, not just under different numbers. A fork
that disagrees with an upstream ADR records that disagreement as its own
decision, which links to the upstream one.

## In practice

```bash
# Declare the fork and its namespace (dry run first, then --write)
npx tsx src/index.ts init --name "Acme" --namespace acme --write

# A fork decision
cp templates/adr.md company/decisions/0001-our-first-decision.md

# A fork hub module
mkdir -p hub/modules/acme-payroll/payload

# Confirm nothing landed in upstream's namespace
npx tsx src/index.ts boundary check
```
