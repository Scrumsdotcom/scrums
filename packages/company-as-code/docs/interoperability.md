# Interoperability

A company graph only this framework can read is a private format with extra
steps. Three things make the model consumable from outside it.

## 1. Versioned schema identifiers

Every schema carries a `$id` under `https://company-as-code.dev/schemas/`, and
the path names the document version:

```
https://company-as-code.dev/schemas/v1alpha1/agent.schema.json
```

The `$id` changes when the document version changes, and at no other time. The
exact bytes of a schema at a given framework release are pinned by the release
tag and recorded, with a hash, in `framework.lock.json`.

The format is `v1alpha1`, so it can still change between releases. Every
change that would invalidate an existing document ships with a migration that
`cac migrate` applies, and an [ADR](./adr). Once the format reaches stable
`v1`, changes within it are additive only: adding an optional property,
widening an enum, relaxing a pattern, adding a `$def`. The full ladder is in
[`docs/standards/versioning.md`](./standards/versioning.md).

## 2. Typed reference edges

Every cross-document reference field is annotated with `x-cac-ref`, naming the
primitive kinds it may point at:

```json
"metric":   { "type": "string", "x-cac-ref": ["Metric"] },
"module":   { "type": "string", "x-cac-ref": ["Manifest"] },
"implements": { "type": "array", "items": { "type": "string", "x-cac-ref": ["Requirement"] } }
```

A reference field is therefore not a string that happens to look like an ID. It
is a typed edge to a known kind of entity, which makes the corpus one
traversable graph rather than a set of documents that mention each other.

Two consumers read the annotations. `cac validate` resolves every edge and
fails on the ones that dangle, which replaced a family of hand-written "does
this ID exist" checks with one resolver. `cac generate` walks the same edges to
build the company graph, so no edge list is hand-maintained.

The set of edges is inventoried in a test. Adding a reference field without
annotating it fails, and so does annotating something that should not be an
edge. The edge set is a design decision, not something that drifts in.

## 3. A JSON-LD context

`cac generate` emits [`/generated/context.jsonld`](../generated/context.jsonld),
mapping the primitives and their identifying fields onto vocabularies that
already exist:

| Vocabulary | Used for |
|---|---|
| [schema.org](https://schema.org/) | People, organizations, names, dates |
| [W3C Organization ontology](http://www.w3.org/ns/org#) | Units, membership, sub-organization structure |
| [PROV-O](http://www.w3.org/ns/prov#) | Agents, activities, attribution |
| [OSCAL](https://pages.nist.gov/OSCAL/) | Controls, requirements, evidence |
| [SKOS](http://www.w3.org/2004/02/skos/core#) | The L1 lifecycle buckets, published as a concept scheme |
| [Dublin Core](http://purl.org/dc/terms/) | Titles, descriptions, supersession, dates |

Where an established vocabulary has the concept, the mapping uses it. Where it
does not, the term is minted under `https://company-as-code.dev/ns#` rather
than stretching someone else's.

Reference fields are typed `@id`, so a consumer follows them as links rather
than reading them as strings. That is the same typed-edge idea as `x-cac-ref`,
expressed in a vocabulary an outside system already speaks.

Nothing in the framework depends on the context existing. It is there so that
an external system, a knowledge graph, or a regulator's tooling can consume an
export without a bespoke adapter, and so a fork can extend the mapping instead
of inventing one.

## 4. Schema-driven SDKs

The schemas project into TypeScript interfaces and Python `TypedDict`s under
[`/generated/sdk`](../generated/sdk). An agent written in either language type-checks
against the specification without anyone hand-writing the types. Adding a
language is one emitter function; the schema-walking core is shared.

## What is deliberately not standardised

**Storage.** The reference runtime host uses SQLite or Postgres. Nothing in the
specification requires either.

**Transport.** No wire protocol is defined. Forks expose the coordination layer
however they like.

**The AI runtime.** Skills generate per-runtime adapters precisely so that no
runtime is canonical. An agent declares `runtime: llm`; which model serves that
is a deployment decision made by the runtime host, not a fact recorded in the
company's source of truth.

That last one is load-bearing. Model names in canonical documents are the
fastest way to build something that is stale within a quarter.

## Conformance

A second implementation is only interoperable if it agrees with the first on
what is valid. The cases in [`/conformance`](../conformance) define that
agreement, and `cac conformance --impl "<command>"` measures any
implementation against them.

## See also

- [`/schemas/README.md`](../schemas/README.md)
- [`/generated/sdk/README.md`](../generated/sdk/README.md)
- [ADR-0007](./adr/0007-typed-reference-edges.md)
