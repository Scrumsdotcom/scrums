# Conformance suite

What "a correct Company-as-Code implementation" means, written as test cases
instead of prose.

> **Status: scaffold.** Ten cases cover the validation level. The protocol is
> stable enough to build against; the case list is not complete. Adding cases
> is one of the most useful contributions anyone can make.

## Why this exists

The specification says the CLI is one reference implementation and invites
ports to Go, Python, Rust, or anything else. Without shared cases, each port
decides for itself what "valid" means, and the format splits into dialects
that only work with their own tooling. A format that outlives its first
implementation needs a definition of correct that is not that implementation.

## What a case is

Each folder under `cases/` holds a small company tree and the verdict any
implementation must reach on it:

```
cases/r001-dangling-reference/
  case.yaml        the expected verdict, and why
  company/         the documents to judge
```

```yaml
id: r001-dangling-reference
level: validate
description: >
  A goal measured by a metric that does not exist...
expect:
  valid: false
  failures:
    - rule: reference
      file: company/goals/GOAL-LEDGER-0001.yaml
```

Case IDs start with the rule they exercise: `v` valid, `c` classification,
`s` schema, `r` reference, `x` cross-document.

## The rules

Verdicts are deliberately coarse. Error wording belongs to each
implementation. Which file failed which rule does not.

| Rule | Meaning |
|---|---|
| `classification` | A YAML file under `company/` could not be routed to a primitive: no `kind`, an unknown `kind`, or not a mapping. Files with a `# cac:ignore` comment in their first lines are skipped. |
| `schema` | A document does not validate against the schema for its `kind`, in [`/schemas`](../schemas). |
| `reference` | A field annotated `x-cac-ref` names something that does not exist. The failure belongs to the document holding the reference. |
| `cross-document` | Documents are each valid alone but disagree with each other, for example an agent its module does not declare. |

## The protocol

An implementation is any command that takes a case directory as its last
argument and prints one JSON object on standard output:

```json
{ "valid": false, "failures": [{ "rule": "reference", "file": "company/goals/GOAL-LEDGER-0001.yaml" }] }
```

`file` is relative to the case directory, or `null` for a failure that belongs
to the corpus as a whole. Duplicate `(rule, file)` pairs count once. An
implementation passes a case when `valid` matches and the set of
`(rule, file)` pairs matches exactly: missing a failure is too lenient, and
reporting an extra one is too strict.

## Running it

From `/cli`:

```bash
# The reference implementation
npx tsx src/index.ts conformance

# Any other implementation
npx tsx src/index.ts conformance --impl "my-cac-port validate --json"

# Machine-readable results, for a badge or a CI summary
npx tsx src/index.ts conformance --impl "my-cac-port validate --json" --json
```

The reference implementation also speaks the protocol, which is how the
runner itself is tested:

```bash
npx tsx src/index.ts conformance verdict ../conformance/cases/v001-minimal-company
```

## Adding a case

1. Copy `cases/v001-minimal-company` to a new folder named for the rule and
   the behaviour.
2. Change the smallest thing that triggers exactly one rule on one file.
   A case that fails three ways teaches less than three cases that fail one way
   each.
3. Write `case.yaml`: what must happen, and in `description`, why.
4. Run the suite. If the reference implementation disagrees with your case,
   one of them is wrong; say which in the pull request.

## What is not covered yet

- **Generation.** Whether an implementation's generated registries match the
  reference output byte for byte. Planned as a second level, `generate`.
- **Runtime behaviour.** Dry-run defaults, human-gated steps, audit records.
  These need a protocol for driving a runtime, which does not exist yet.
- **Most cross-document rules.** One case exercises the category; most of the
  individual rules in `cli/src/validate.ts` have no case yet.
