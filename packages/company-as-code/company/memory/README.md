# /company/memory

Persistent agent memory namespaces. Distinct from documentation. One folder per agent or scope; each memory is an atomic file with frontmatter.

Memory holds: collaboration patterns, parked epics, references to external systems, feedback that should shape future agent behavior. It does **not** hold: code patterns, git history, ephemeral task state, fix recipes for resolved bugs.

Every memory carries a verify-before-trust assumption — recalled claims must be checked against current state before action.

## Structure

```
/company/memory/
├── <agent-name>/
│   ├── MEMORY.md          — index (always loaded into agent context)
│   ├── <slug-1>.md         — atomic memory entry with frontmatter
│   └── <slug-2>.md
└── <another-scope>/
    └── ...
```

## Memory types (frontmatter `metadata.type`)

| Type | Purpose |
|---|---|
| `user` | Who the user is, what they know, how they prefer to work |
| `feedback` | Corrections or validations from past sessions — apply going forward |
| `project` | Current state of ongoing work, why decisions were made |
| `reference` | Pointers into external systems (Slack channel, Linear project, dashboard URL) |

## Worked example

The [`cash-forecaster/`](./cash-forecaster) subdirectory shows the pattern:

- [`MEMORY.md`](./cash-forecaster/MEMORY.md) — the index agents always load
- [`forecasting-window.md`](./cash-forecaster/forecasting-window.md) — a `project` memory: why 13-week rolling
- [`cfo-format-preference.md`](./cash-forecaster/cfo-format-preference.md) — a `feedback` memory: CFO wants ≤ 5 bullets

## Memory hygiene

- One slug, one concept, one file.
- The index lists all memories with a one-line hook; keep under ~200 lines.
- Memories that turn out to be wrong or stale are **removed**, not amended into incoherence.
- A memory naming a specific file or symbol is a claim — verify it still exists before acting on it.
