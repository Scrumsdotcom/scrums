# /company/skills

Tier-3 of the three-tier knowledge model: **composable, reusable expertise referenced by name**. Distinct from:

- **Tier 1 — Context** (long-form narrative, lives in ADRs and architecture docs)
- **Tier 2 — Runtime entry-points** (numbered procedures, lives in tasks, workflows, playbooks)
- **Tier 3 — Skills** (this directory — reusable techniques referenced by name)

## One source, many runtimes

Each skill lives as **one canonical YAML file** in this directory. The CLI generators emit per-runtime adapters under `/generated/skills/`:

| Adapter | Target runtime | Output path |
|---|---|---|
| `claude/` | Claude Code, Claude Agent SDK | `/generated/skills/claude/<name>/SKILL.md` |
| `agents-md/` | Codex, Cursor, Aider, Continue, any AGENTS.md-aware tool | `/generated/skills/agents-md/<name>.md` |
| `gemini/` | Gemini Gems (also a workable shape for OpenAI Assistants) | `/generated/skills/gemini/<name>.gem.json` |

Forks add a fourth adapter (LangChain hub, Mistral, custom IDE rules, …) by writing one small function in `cli/src/generate.ts`. The canonical YAML never changes.

## How agents reference skills

An agent's manifest may list the skills it is authorized to invoke:

```yaml
# agents/my-agent.yaml
skills:
  - sync-verification
  - resolve-drift
```

Agents inherit the skill's `autonomy` floor — they may narrow it (more restrictive) but never widen it. The per-agent context bundle generator surfaces the agent's authorized skills alongside its tools.

## Available skills

Validate against [`/schemas/skill.schema.json`](../../schemas/skill.schema.json).

| Skill | Purpose |
|---|---|
| [`add-module`](./add-module.yaml) | Bootstrap a new module: manifest → validate → regenerate |
| [`add-agent`](./add-agent.yaml) | Add an agent to an existing module with the right autonomy classification |
| [`add-integration`](./add-integration.yaml) | Wire a new external system in through canonical IDs |
| [`resolve-drift`](./resolve-drift.yaml) | Recover when the drift gate fails on a PR |
| [`sync-verification`](./sync-verification.yaml) | Apply the 5-step verification protocol to a state-mutating sync |

## Skill rules

- One YAML, one skill — no multi-doc files.
- Bump `version:` when the technique changes. Renaming an instance does not bump the skill.
- Generated outputs are committed (`/generated/skills/`). The drift gate protects them.
- Skills never embed secrets, vendor names, or canonical IDs of specific entities. They describe technique, not instance.
