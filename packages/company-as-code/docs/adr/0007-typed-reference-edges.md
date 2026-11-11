# ADR 0007: Typed reference edges in the schemas

- **Status:** Accepted
- **Date:** 2026-08-16
- **Deciders:** Seed maintainers
- **Tags:** schemas, validation, graph, interoperability

## Context

Cross-document references were plain strings. `Goal.metric` held a metric ID.
`Agent.module` held a module path. `Manifest.consumes[].from` held the path of
the module being consumed from. Nothing in the schema said which of those
strings pointed at what.

Referential integrity was therefore enforced by hand-written checks, one per
field, in `crossDocumentChecks`. There were four of them, which covered maybe a
third of the reference fields in the corpus. The roadmap carried "the
referential-integrity check suite" as a Next item, and the honest reason it had
not been built is that writing twenty more bespoke checks is unappealing work
that goes stale the moment somebody adds a field.

The consequences were measurable. When the resolver described below was
written and run for the first time against the seed repository, it found
**twenty-four dangling references**, including six modules that other modules
declared they consumed interfaces from but which had never declared a manifest,
two dashboards referenced by four documents but never defined, two metrics
referenced by workflows but never defined, and two automations that a workflow
called by name but which did not exist.

The repository had been violating its own "no consumes entry without a
corresponding exposes entry" rule since the first commit, and no check could
see it.

## Decision

Annotate every cross-document reference field in the schemas with a custom
keyword naming the primitive kinds it may point at:

```json
"metric": { "type": "string", "x-cac-ref": ["Metric"] }
```

The keyword is an annotation, not a constraint. Ajv cannot resolve it, because
Ajv validates one document at a time and resolution needs the whole corpus. It
is registered with Ajv purely so strict mode accepts the annotated schemas.

Two consumers read it:

**`cac validate`** builds an identity index over the corpus and resolves every
annotated edge. A reference that resolves to nothing is an error naming the
file, the field path, the value, and the kinds it was allowed to point at. This
replaced four bespoke checks with one resolver and expanded coverage from four
fields to thirty-one.

**`cac generate`** walks the same edges to build
`/generated/company-graph.json`. There is no hand-maintained edge list; the
graph is derived from the schemas.

The edge set is inventoried in a test as an explicit list. Adding a reference
field without annotating it fails, and so does annotating something that should
not be an edge.

## Consequences

**Good.** Adding a reference field is a one-line schema annotation instead of a
new check in the validator. The disincentive that kept referential integrity
partial is gone.

**Good.** The company graph is a projection of the schemas rather than a
parallel artefact. It cannot drift from what the schemas declare, because it is
computed from them.

**Good.** The same annotation carries into the JSON-LD context, where reference
fields are typed `@id` so external consumers follow them as links.

**Cost.** The resolver walks schema and document in parallel and handles the
JSON Schema constructs the canonical schemas actually use: `properties`,
`items`, local `$ref` into `$defs`, and the `allOf` / `anyOf` / `oneOf`
combinators. It is not a complete JSON Schema implementation. An unsupported
construct carries no edges silently, which is why the inventory test exists.

**Cost.** Some reference-shaped fields are deliberately not annotated, and the
reasons have to be understood rather than guessed:

- `Dashboard.panels[].metric` accepts interface-relative references like
  `derived/runway_weeks` alongside canonical metric IDs.
- `Manifest.parent` points at organizational folders that legitimately have no
  manifest. The specification explicitly allows a folder to exist for
  organizational signalling without claiming runtime ownership.
- `Skill.owner.module` may be the literal `framework` for skills the framework
  itself owns.
- Holder-shaped fields (`{ kind, id }` pairs like `Capability.primaryOwner`)
  cannot be annotated, because the kind that decides where the id resolves
  lives in the data rather than in the schema. Those are validated by a
  purpose-built check and rendered into the graph by a purpose-built walker.

## Alternatives considered

**Keep writing bespoke checks.** Rejected. Twenty-four dangling references
accumulated under that regime, which is the argument.

**Use `$ref` to other schema files and let Ajv resolve.** Rejected. `$ref`
resolves schema documents, not instance identifiers. It answers "is this the
right shape," not "does this ID exist in the corpus."

**Adopt corpospec's `x-corpospec-ref` verbatim.** The idea is theirs and the
attribution is real. The keyword is namespaced to this framework because the
identity model differs: a module's identity here is its path rather than a
document ID, and the resolver has to know that.

**Make the annotation a constraint that Ajv enforces.** Not possible. Ajv
validates documents in isolation; corpus-wide resolution is a different pass.

## Implementation

- `cli/src/refs.ts`: the walker, the resolver, and the error formatter
- `cli/src/graph.ts`: the company graph, derived from the same edges
- `cli/src/validate.ts`: keyword registration and error reporting
- `cli/test/validate.test.ts`: the edge inventory

## Links

- [`/docs/interoperability.md`](../interoperability.md)
- [corpospec.com](https://github.com/CorpoSpec/corpospec.com), where the typed
  PathRef idea comes from
