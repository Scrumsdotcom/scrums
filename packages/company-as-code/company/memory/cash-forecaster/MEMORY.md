# Memory index: cash-forecaster

Per-agent memory namespace for the [`cash-forecaster`](../../domains/finance-ops/finance/agents/cash-forecaster.yaml) agent. Each entry is an atomic file with frontmatter. This index lists every memory with a one-line hook for fast scanning.

> **Convention:** the `MEMORY.md` index is always loaded into the agent's context. Individual entries are loaded by name when the agent decides they are relevant. Keep this index under ~200 lines.

- [Forecasting window matches treasury practice](./forecasting-window.md), Why we settled on a rolling 13-week window
- [CFO prefers concise weekly briefs](./cfo-format-preference.md), Feedback memory: keep briefs ≤ 5 bullets
