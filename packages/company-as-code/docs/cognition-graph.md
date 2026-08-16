# The Visual Cognition Graph

The Mermaid diagrams in [`architecture.md`](./architecture.md) are a static
picture. The **Visual Cognition Graph** is the live, interactive version: the
company's domains and modules as a clickable graph, generated from the source
of truth and overlaid with real runtime activity.

Stakeholders click through the domains to see each module's agents, workflows,
metrics, and how much audit, event, and HITL activity it has actually seen.

## Two layers

### 1. Structure: generated, drift-gated

`cac generate` produces [`/generated/cognition-graph.json`](../generated/cognition-graph.json):
domains → modules → agents / workflows / metrics, plus the module-to-module
dependency edges. It is built deterministically from `/company/**` and gated by
`cac generate --check` like every other generated artefact, so the diagram can
never drift from the manifests.

### 2. Live overlay. Read from the runtime

`cac-host graph serve` starts an interactive server that loads that structure
and overlays the **live** layer, read straight from the runtime's SQLite
database:

- typed-event and audit-row counts per module
- dry-run counts per module
- pending HITL approvals per module
- recent events and recent traces
- global totals: events, audit rows, traces, snapshots, pending approvals

```bash
cd runtime
npm run start -- graph serve --repo .. --db ./runtime.db
# → Visual Cognition Graph listening on http://127.0.0.1:4100
```

Open the URL: modules are nodes colored by lifecycle, sized with a live
activity badge, connected by their dependency edges. Click a module to open a
detail panel, its agents (with autonomy + cadence), workflows (with HITL
flag), metrics, exposed interfaces, live activity counters, and its most recent
typed events. The overlay auto-refreshes every few seconds.

## API

The server is a thin JSON layer. A fork can build its own front-end against:

| Route | Returns |
| --- | --- |
| `GET /` | the interactive single-page graph |
| `GET /api/graph` | the static structure (`/generated/cognition-graph.json`) |
| `GET /api/live` | the live overlay (`CognitionLiveReader` over the runtime DB) |

## How it connects to the rest of the framework

- **The CLI** generates the structure; the **runtime** serves the live overlay.
  The two halves meet at `/generated/cognition-graph.json`.
- The live overlay is read from the **same SQLite database** the workflow
  executor, the HITL inbox, and state snapshotting all write to, so the graph
  reflects audit rows, typed events, HITL pending counts, traces, and snapshots
  without any extra instrumentation.
- It is tolerant of a cold start: if the runtime has never executed anything,
  every live counter is simply zero.

## Limits (reference, not product)

- The layout is a deterministic domain-column layout: readable, not a force
  simulation. Forks swap the front-end against the same two JSON endpoints.
- "Agent memory" in the spec's pitch is represented here as live event/audit
  activity per module; a fork that persists structured agent memory can surface
  it through the same `/api/live` shape.
- No auth on the API: it is a read-only diagnostic surface for a trusted
  network, like the HITL dashboard.
