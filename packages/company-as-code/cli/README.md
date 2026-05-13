# /cli

Reference CLI for Company-as-Code. TypeScript / Node, schema-driven, deterministic.

## Commands

```bash
npm install
npm run validate         # validate every manifest, agent, workflow, etc.
npm run generate         # write /generated/*.json
npm run generate:check   # CI drift gate: exits non-zero on drift
npm test                 # unit tests (vitest) for validator + cross-doc checks
npm run test:e2e         # validate + drift gate against the whole seed
```

## What it does

- **`validate`** — walks `/company/**/*.{yaml,yml}`, classifies each document by its `kind`, validates against the matching JSON Schema in `/schemas`. Also runs cross-document discipline checks (HITL invariants, escalation requirements, goal/metric reference resolution).
- **`generate`** — deterministic generators producing:
  - `/generated/agent-catalogue.json` — every autonomous unit, with module, cadence, autonomy
  - `/generated/flow-registry.json` — every workflow, with trigger, HITL flag, step count
  - `/generated/dependency-graph.json` — module-to-module interface dependencies
  - `/generated/domain-model.json` — module ownership of tables and schemas
  - `/generated/context-bundles/<module>__<agent>.json` — one bundle per agent with resolved read/write access, tools, canonical events, HITL constraints, and observability surfaces (per the spec's "structured context bundles for agents")

Generators sort their outputs by stable keys. Identical inputs produce byte-identical outputs.

## Drift gate

`npm run generate:check` reads each file the generator would write and compares to disk. If anything would change, it exits non-zero with the list of drifted files. Run `npm run generate` to fix drift and commit the result.

## Implementation

- `src/index.ts` — CLI entry point
- `src/loader.ts` — schema + corpus loader
- `src/validate.ts` — schema validation + cross-doc discipline checks
- `src/generate.ts` — generators + drift checker
- `src/paths.ts` — repo-relative path helpers
