# /cli

Reference CLI for Company-as-Code. TypeScript / Node, schema-driven, deterministic.

## Commands

```bash
npm install
npm run validate         # validate every manifest, agent, workflow, etc.
npm run generate         # write /generated/*.json
npm run generate:check   # CI drift gate: exits non-zero on drift
npm run doctor           # standing health inspection: findings fail, warnings report
npm run hub -- list      # browse the CaC-Hub module registry
npm test                 # unit tests (vitest) for validator + cross-doc checks
npm run test:e2e         # validate + drift gate against the whole seed
```

## What it does

- **`validate`**: walks `/company/**/*.{yaml,yml}`, classifies each document by its `kind`, validates against the matching JSON Schema in `/schemas`, resolves every typed reference edge declared with `x-cac-ref`, and runs the cross-document discipline checks (HITL invariants, escalation requirements, capability chain rules, compliance coverage, proposal rulings).
- **`doctor`**: the standing health inspection. Rotted documentation links, stale controls, modules with nobody accountable, autonomous agents nothing watches, isolated graph entities, unruled proposals. Findings fail the run; warnings report and pass. `--strict` promotes warnings. See [`/docs/doctor.md`](../docs/doctor.md).
- **`hub`**: the CaC-Hub module registry: `list`, `show <name>`, `add <name>` (dry-run by default; `--write` to scaffold a module's payload into `/company`), and `validate` (every hub payload is held to the same schema bar as `/company`). See [`/docs/hub.md`](../docs/hub.md).
- **`nl2m`**: Natural Language to Manifest: drafts a linked, schema-valid Initiative + Goal + Metric triple from a prose description. Deterministic heuristic parser, dry-run by default, `--write` to create the files. See [`/docs/nl2m.md`](../docs/nl2m.md).
- **`generate`**: deterministic generators producing:
  - `/generated/agent-catalogue.json`: every autonomous unit, with module, cadence, autonomy
  - `/generated/flow-registry.json`: every workflow, with trigger, HITL flag, step count
  - `/generated/dependency-graph.json`: module-to-module interface dependencies
  - `/generated/domain-model.json`: module ownership of tables and schemas
  - `/generated/context-bundles/<module>__<agent>.json`: one bundle per agent with resolved read/write access, tools, canonical events, HITL constraints, and observability surfaces (per the spec's "structured context bundles for agents")
  - `/generated/sdk/typescript/*.ts` + `/generated/sdk/python/*.py`, schema-driven SDKs: a type-safe surface per JSON Schema, so a "Company Agent" can be written in any supported language and still type-check against the CaC spec (see `src/sdk.ts` and `/generated/sdk/README.md`)
  - `/generated/hub-index.json`: the CaC-Hub registry index, built from every `hub/modules/*/hub-module.yaml`
  - `/generated/cognition-graph.json`: the structural cognition graph (domains → modules → agents/workflows/metrics + dependency edges); the runtime's `graph serve` renders it interactively (see [`/docs/cognition-graph.md`](../docs/cognition-graph.md))
  - `/generated/company-graph.json`: every canonical entity as a node and every typed edge between them, derived from the `x-cac-ref` annotations plus module containment. Cyclic by construction (see [ADR-0007](../docs/adr/0007-typed-reference-edges.md))
  - `/generated/control-matrix.json`: requirement coverage inverted from each Control's `implements` list, with an explicit `gaps` array and per-framework totals
  - `/generated/capability-map.json`: every ownership chain flattened, with degradation depth and ownership concentration
  - `/generated/context.jsonld`: the JSON-LD context mapping the primitives onto schema.org, the W3C Organization ontology, PROV-O, OSCAL, and SKOS (see [`/docs/interoperability.md`](../docs/interoperability.md))

Generators sort their outputs by stable keys. Identical inputs produce byte-identical outputs.

## Drift gate

`npm run generate:check` reads each file the generator would write and compares to disk. If anything would change, it exits non-zero with the list of drifted files. Run `npm run generate` to fix drift and commit the result.

## Implementation

- `src/index.ts`: CLI entry point
- `src/loader.ts`: schema + corpus loader
- `src/validate.ts`: schema validation + cross-doc discipline checks
- `src/refs.ts`: the typed-reference walker and resolver
- `src/graph.ts`: the company graph generator
- `src/compliance.ts`: the control matrix and capability map generators
- `src/jsonld.ts`: the semantic context generator
- `src/doctor.ts`: the standing health inspection
- `src/generate.ts`: generators + drift checker
- `src/sdk.ts`: schema-driven SDK generator (TypeScript + Python emitters)
- `src/hub.ts`: CaC-Hub registry: loader, index generator, `hub` subcommands
- `src/nl2m.ts`: Natural Language to Manifest: prose parser, ID allocation, synthesis
- `src/cognition.ts`: cognition-graph generator (the structure the runtime's `graph serve` renders)
- `src/paths.ts`: repo-relative path helpers
