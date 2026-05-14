# NL2M — Natural Language to Manifest

`cac nl2m` turns a prose description of a company initiative into a linked,
schema-valid **Initiative + Goal + Metric** triple. A CEO describes the
intent in plain language; NL2M drafts the YAML.

```bash
cd cli
npm run nl2m -- "Reduce CAC payback to 9 months by Q4 so growth is self-funding"
npm run nl2m -- --file ./initiative-brief.txt
npm run nl2m -- "Cut monthly burn to \$200000 this quarter" --write --owner team:finance
```

## What it produces

From one sentence, NL2M drafts three linked documents:

- an **Initiative** (`company/initiatives/INIT-<DOMAIN>-NNNN-<slug>.yaml`)
- a **Goal** (`company/goals/GOAL-<DOMAIN>-NNNN-<slug>.yaml`) referencing the metric
- a **Metric** (`company/metrics/METRIC-<DOMAIN>-<slug>.yaml`)

The triple is fully cross-linked — `Initiative.goals` → the goal,
`Goal.metric` → the metric, `Goal.initiatives` → the initiative — so it passes
the framework's cross-document discipline checks out of the box.

## How it works — deterministic, not magic

The reference NL2M is a **deterministic heuristic parser**, not an LLM call.
The CLI must be reproducible and testable, so NL2M extracts structure with
explicit rules:

| Signal | How it's detected |
| --- | --- |
| **Domain** | keyword scoring (cash/runway → finance-ops, CAC/funnel → sales-marketing, deploy/uptime → product-operations); ties → cross-domain |
| **Title** | first sentence, with "we want to / let's / plan to" prefixes stripped |
| **Direction** | `reduce/cut/lower` → `lte`; `increase/grow/reach` → `gte`; also `below/above` phrasing |
| **Target value** | first number after `to` / `below` / `above`; `$` → currency, `%` → percentage, `days/months` → duration |
| **Goal type** | `sla` for durations or explicit "SLA"; `kpi` for "KPI"; `target` for downward goals; else `okr` |
| **Horizon** | `Q[1-4]`/`quarter` → quarterly, `year` → yearly, `month` → monthly, `week` → weekly |
| **IDs** | scans the existing `/company` corpus so the next sequence number never collides |

Where the parser has to guess, it says so. Every output document carries a
`# nl2m: review` header listing exactly which fields were inferred — and the
fields it cannot derive (the metric's `owner.module`, `formula`, `lineage`,
`thresholds`) are written as honest `TBD` placeholders. The output **always
validates against the canonical schemas**; the human (or an agent) fills the
review fields before the docs go live.

## Dry-run by default

`cac nl2m` prints the drafted YAML and writes nothing. Pass `--write` to create
the files. NL2M refuses to overwrite existing files — it only ever creates new
drafts. This mirrors the framework's dry-run-as-a-first-class-invariant
discipline: you see the projected documents before they land.

After `--write`:

```bash
cd cli
npm run validate     # the triple is schema-valid; cross-doc checks confirm the links
npm run generate     # the new initiative/goal/metric flow into the registries
```

## How NL2M connects to the rest of the framework

- **Schemas** — output is validated against `initiative`, `goal`, and `metric`
  schemas before it is printed or written. Invalid output is a bug, not a
  silent pass.
- **The corpus** — ID allocation scans `/company` so generated IDs are unique.
- **Cross-document checks** — the triple is pre-linked, so `cac validate` is
  green the moment the review fields are filled.
- **The next step** — once the metric has a real owning module, declare the
  agent that will move it with the `add-agent` skill, or import a ready-made
  module from the [CaC-Hub](./hub.md).

## Future: an agent-backed NL2M

The heuristic parser is the deterministic floor. A fork can plug a real
language model behind the same command surface — the contract is "prose in,
schema-valid linked triple out, review markers on anything inferred". The
reference implementation proves the contract; smarter extraction is an upgrade,
not a redesign.
