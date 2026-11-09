# The CaC-Hub

The CaC-Hub is Company-as-Code's **module registry**, a place for
community-contributed, importable building blocks. A "Standard HR Module" or a
"subscription-billing integration" is written once, validated against the
canonical schemas, and forked into any company that needs it.

The hub is what turns Company-as-Code from a framework into an ecosystem.

## How it works

```
hub/
  README.md
  modules/
    <module-name>/
      hub-module.yaml      # HubModule metadata, schema: /schemas/hub-module.schema.json
      payload/             # the files `cac hub add` scaffolds into /company
        manifest.yaml
        README.md
        ...
```

- **`hub-module.yaml`** declares the module: name, version, summary, category,
  maturity, provenance (author + license), target domain, and a `scaffolds[]`
  inventory of every payload file.
- **`payload/`** holds the actual files. Every file with a known primitive
  `kind` (Manifest, Workflow, Agent, Integration, …) must be schema-valid.
- The registry index: [`/generated/hub-index.json`](../generated/hub-index.json)
  # is **generated** by `cac generate`, never hand-maintained, so it can't drift.

## Commands

```bash
cd cli
npm run hub -- list                       # browse available modules
npm run hub -- show standard-hr           # metadata + scaffold inventory
npm run hub -- add standard-hr            # DRY-RUN: print the projected file writes
npm run hub -- add standard-hr --write    # apply: scaffold into /company
npm run hub -- add standard-hr --write --into company/domains/finance-ops/hr
npm run hub -- validate                   # validate every payload against the schemas
```

### `cac hub add` is dry-run by default

Like every write path in Company-as-Code, `cac hub add` shows you the projected
change before it lands. The default run prints every file it *would* create and
where; `--write` commits them. It refuses to overwrite existing files. Pick a
different `--into` path if you hit a collision.

The install path is derived from the module's `targetDomain`
(`company/domains/<domain>/<name>`), or set explicitly with `--into`.

After `--write`, fill in the `TBD` placeholders, then run `cac validate` and
`cac generate`: the scaffolded payload is schema-valid on arrival, but the
cross-document checks (contacts, interface resolution) need your real values.

## How the hub connects to the rest of the framework

- **Schemas**: `hub-module.yaml` is itself a canonical primitive
  (`HubModule`), so it gets a generated SDK type like every other schema.
- **Drift gate**: `hub-index.json` is a generated artefact; `cac generate --check`
  gates it in CI.
- **Validation**: `cac hub validate` reuses the exact AJV setup and schema set
  that `cac validate` uses for `/company`. A hub payload is held to the same bar.
- **Skills**: the `add-module` skill is the from-scratch path; the hub is the
  import-an-existing-one path. They produce the same end state: a schema-valid
  module under `/company`.

## Contributing a module

1. `mkdir -p hub/modules/<your-module>/payload`
2. Write `hub/modules/<your-module>/hub-module.yaml` (kind `HubModule`).
3. Add the scaffold files under `payload/`. Keep them schema-valid and, where
   possible, cross-document-clean (empty inline `agents:` blocks, `TBD`
   contacts) so the importing company starts green.
4. List **every** payload file in the `scaffolds:` block, `cac hub validate`
   enforces that `scaffolds[]` and `payload/` agree exactly.
5. `npm run hub -- validate`: must be green.
6. `npm run generate`: picks the module up into `hub-index.json`.
7. Open a PR. New modules start at `maturity: experimental`; they graduate to
   `beta` and `stable` through real adoption, like any other artefact.

## Guardrails

- **Vendor-neutral.** Hub modules follow the same rule as the framework: the
  canonical `name` is neutral, the vendor is a `system:` label. The
  `subscription-billing` example maps to a `billing-provider` integration, not
  a named SaaS product.
- **No secrets.** Payloads reference secrets by `secretRef`, never inline.
- **Payloads are starting points, not finished modules.** A hub module is a
  validated skeleton. The importing company owns it after `cac hub add`.
