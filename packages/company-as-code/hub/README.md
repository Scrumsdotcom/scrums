# CaC-Hub — the module registry

The CaC-Hub is a registry of **community-contributed, importable modules**. A
hub module bundles a validated payload — a manifest, plus whatever workflows,
agents, policies, or docs it needs — that can be scaffolded into any company's
`/company` tree with one command.

This is how Company-as-Code becomes an ecosystem: a "Standard HR Module" or a
"subscription-billing integration" is written once, validated against the
canonical schemas, and forked into any company that needs it — without
copy-pasting and without drift.

## Layout

```
hub/
  README.md
  modules/
    <module-name>/
      hub-module.yaml      # HubModule metadata (schema: /schemas/hub-module.schema.json)
      payload/             # the files `cac hub add` scaffolds into /company
        manifest.yaml
        README.md
        ...
```

The registry index itself is **generated**, not hand-maintained:
[`/generated/hub-index.json`](../generated/hub-index.json) is produced by
`cac generate` from every `hub-module.yaml`, so it can never drift.

## Using the hub

```bash
cd cli
npm run hub -- list                       # browse available modules
npm run hub -- show standard-hr           # inspect one module
npm run hub -- add standard-hr            # DRY-RUN: print what would be scaffolded
npm run hub -- add standard-hr --write    # actually scaffold into /company
npm run hub -- validate                   # validate every hub payload against the schemas
```

`cac hub add` is **dry-run by default** — it prints the exact files it would
write and where. Pass `--write` to commit them. This mirrors the framework's
dry-run-as-a-first-class-invariant discipline: you see the projected change
before it lands.

The install path is derived from the hub module's `targetDomain`
(`company/domains/<domain>/<name>`), or override it with `--into <path>`.

## Contributing a module

1. Create `hub/modules/<your-module>/hub-module.yaml` (kind `HubModule`).
2. Put the scaffold files under `hub/modules/<your-module>/payload/`.
3. List every payload file in the `scaffolds:` block.
4. Run `npm run hub -- validate` — every payload primitive must be schema-valid.
5. Run `npm run generate` so `/generated/hub-index.json` picks it up.
6. Open a PR. New modules start at `maturity: experimental`.

See [`/docs/hub.md`](../docs/hub.md) for the full contributor guide.
