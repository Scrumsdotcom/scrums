# Standard: Code organization

## Rule

All business logic lives in the module that canonically owns it. Cross-module communication happens only through declared interfaces.

## Layout

```
/company/<scope>/<module>/
├── manifest.yaml           # module identity, owns/consumes/exposes, agents, invariants, contacts
├── README.md               # human pointer to the manifest and the worked story
├── agents/                 # autonomous units owned by this module
├── workflows/              # orchestrations owned by this module
├── playbooks/              # runbooks / SOPs
├── sub-cognition/<name>/   # child modules with their own manifests (recursive)
```

## What goes where

- **Business logic** → the module's source files (alongside the manifest)
- **Runtime config** → manifest declarations and `/company/runtime/`
- **Shared capabilities (no business logic)** → an infrastructure module
- **Cross-cutting orchestrations** → `/company/workflows/` only when the workflow spans domains; otherwise the owning module
- **Generated artefacts** → `/generated/` only, never hand-edited

## Forbidden

- Direct imports across module boundaries: go through interfaces
- Business logic in infrastructure layers
- Hardcoded vendor names anywhere in code or schema
- New code in a module without a manifest

## Why

Modular monolith discipline is what keeps a single-repo system composable. Without it, the structure collapses into a microservice tangle or an undifferentiated mass.
