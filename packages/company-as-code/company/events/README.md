# /company/events

Typed event ledger. One row per state transition on a canonical entity. Distinct from the [audit log](../observability) — they are not interchangeable.

| | Audit log | Typed event ledger |
|---|---|---|
| Granularity | One row per orchestration action | One row per state transition on a canonical entity |
| Schema | Loose: actor, action, payload, status, duration | Tight: entity, event type (enum), payload |
| Used for | Debugging, post-hoc reasoning, compliance | Replay, derived state, dashboards, agent reasoning |
| Adding a new type | Free | Requires migration + enum update |

## Contents

| File | Role |
|---|---|
| [`event-types.yaml`](./event-types.yaml) | The enum-controlled registry. Every event in the ledger must use a `type:` value from here. |
| [`payloads/<type>.yaml`](./payloads) | Per-type payload schemas. Validate `Event.payload` against these. |

Validate event rows themselves against [`/schemas/event.schema.json`](../../schemas/event.schema.json).

## Adding a new event type

1. Open an ADR proposing the new type and the migration plan.
2. Add a row to `event-types.yaml` with `status: experimental`.
3. Add a payload schema under `payloads/<type>.yaml`.
4. Wire the emission point in the owning module's agent or workflow.
5. After accumulated reliability evidence, promote `status:` to `stable`.

## Deprecation

Event types are deprecated, not deleted. Set `status: deprecated`, leave both the registry entry and the payload schema in place, and update downstream consumers. The ledger always carries history — removing the type definition breaks historical reads.

## Worked example

The `finance.cash_forecast_updated` event type is fully wired:

- Registry entry in [`event-types.yaml`](./event-types.yaml)
- Payload schema at [`payloads/cash-forecast-updated.yaml`](./payloads/cash-forecast-updated.yaml)
- Emission point: [`cash-forecaster`](../domains/finance-ops/finance/agents/cash-forecaster.yaml) `outputs[].emitsEvent`
- Trigger condition: emitted only when the new forecast differs from the previous by ≥1% (per the agent's invariants)
