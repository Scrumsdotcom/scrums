# Shadow Mode for Agents

A new agent should not go straight to autonomous. **Shadow Mode** lets it run
in perpetual `dryRun: true` alongside the human operators doing the real work —
for weeks — accumulating **Reliability Evidence**. When that evidence clears the
promotion bar the company already declared, an **automated ADR proposal**
promotes it to autonomous.

It is the framework's answer to "how do we trust an agent?": not a vibe, an
auditable evidence trail.

## The lifecycle

```
enroll ──▶ shadow (perpetual dry-run) ──▶ evidence accumulates ──▶ propose ADR ──▶ promote
                         ▲                                              │
                         └───────────  observe (human comparison) ──────┘
```

```bash
cd runtime
npm run start -- shadow enroll cash-forecaster --repo ..
# the agent now runs in shadow mode on every `cac-host execute`

npm run start -- shadow status cash-forecaster --repo ..   # reliability evidence + gate
npm run start -- shadow observe cash-forecaster --matched true   # record a human comparison
npm run start -- shadow propose cash-forecaster --repo ..        # draft the promotion ADR
```

## How it works

### 1. Enrollment is the switch

`cac-host shadow enroll <agent>` records the agent in the shadow ledger.
Nothing else about the workflows changes. From then on, `cac-host execute`
wraps the agent invoker in a `ShadowAgentInvoker`: for an enrolled agent it

- **forces `dryRun: true`** for that invocation, whatever the run mode —
  a shadow agent never writes, it only projects;
- **records the invocation** as a row of evidence (agent, correlation, trace,
  a hash of the projection);
- **strips any emitted event** — a shadow agent observes, it does not change
  canonical state.

For agents that are not enrolled, the wrapper is a transparent pass-through.

### 2. Observation is the signal

A shadow run on its own only proves the agent *ran*. The signal is whether its
projection **matched what the human actually did**. When an operator performs
the real action, they record the comparison:

```bash
cac-host shadow observe cash-forecaster --matched true   # or --matched false
```

### 3. Reliability Evidence is the aggregate

`cac-host shadow status <agent>` aggregates the ledger into evidence: days
shadowing, total runs, observed runs, matched runs, **agreement rate**, distinct
traces.

### 4. The promotion gate is the AutonomyPolicy's — not Shadow Mode's

Shadow Mode does not invent a bar. It reads
`promotion.fromHumanGatedToAutonomous.requires` from
[`company/runtime/autonomy-policy.yaml`](../company/runtime/autonomy-policy.yaml):

```yaml
promotion:
  fromHumanGatedToAutonomous:
    requires:
      successfulSyncVerificationInvocations: ">= 3"   # auto — matched runs
      shadowModeDays: ">= 14"                          # auto — days shadowing
      shadowAgreementRate: ">= 0.95"                   # auto — agreement rate
      acceptedADR: required                            # manual — the ADR below
      manifestUpdate: required                         # manual — the manifest PR
```

- A comparison-expression value (`">= N"`) is **auto-checked** against the
  evidence — the key names the metric.
- A `required` value is a **manual gate** a human clears.

### 5. The ADR proposal is the bridge

When every auto requirement is met, `cac-host shadow propose <agent>` drafts a
`Proposed` ADR — following [`/templates/adr.md`](../templates/adr.md) — that
cites the full reliability evidence and proposes moving the agent's `autonomy`
from `human-gated` to `autonomous`. Dry-run by default; `--write` writes the
ADR file into `docs/adr/` and emits a `coordination.agent_promotion_proposed`
event.

The proposal *is* the path that clears the two manual gates: reviewing and
merging it clears `acceptedADR`, and the merge PR sets the manifest's
`autonomy` field, clearing `manifestUpdate`.

## Commands

| Command | Purpose |
| --- | --- |
| `shadow enroll <agent>` | Enroll a declared agent in Shadow Mode. |
| `shadow withdraw <agent>` | Remove an agent from Shadow Mode (evidence is retained). |
| `shadow list` | Every enrollment with an evidence summary. |
| `shadow status <agent>` | Full reliability evidence + the promotion-gate breakdown. |
| `shadow observe <agent> --matched <bool>` | Record a human-comparison observation on a shadow run. |
| `shadow propose <agent> [--write]` | Draft the promotion ADR once the automated gate is met. |

## How Shadow Mode connects to the rest of the framework

- **The audit log** — shadow runs land there as ordinary dry-run audit rows;
  the shadow ledger is the *aggregation* layer on top, not a parallel log.
- **Tracing** — every shadow run records the W3C trace ID it ran under, so the
  evidence is traceable back to the exact execution.
- **The AutonomyPolicy** — the promotion bar is the one the company already
  declared. Shadow Mode reads it; it does not duplicate it.
- **ADRs** — promotion is gated on an accepted ADR (per ADR-0001's discipline);
  `shadow propose` automates the drafting, a human still reviews and merges.
- **The Visual Cognition Graph** — a shadowing agent's activity shows up in the
  graph's live overlay like any other module activity.

## Limits (reference, not product)

- "Matched the human" is a single boolean recorded by an operator. A fork can
  enrich `observe` with structured diffs, partial-match scoring, or an
  automatic comparator against the typed-event ledger.
- The reference `ShadowAgentInvoker` records a hash of the projection. A fork
  that wants to *diff* projections against outcomes persists the full
  projection instead.
