# Anatomy of an Agent

Every autonomous unit in the runtime is declared as an `Agent`. The standalone agent file at `<module>/agents/<name>.yaml` is the source of truth; the inline summary in the owning module's `manifest.yaml` is a discovery aid for the agent catalogue.

Schema: [`/schemas/agent.schema.json`](../../schemas/agent.schema.json). Template: [`/templates/agent.yaml`](../../templates/agent.yaml). Worked examples: [`cash-forecaster`](../../company/domains/finance-ops/finance/agents/cash-forecaster.yaml) (autonomous), [`deploy-watchdog`](../../company/domains/product-operations/platform/agents/deploy-watchdog.yaml) (escalated), [`billing-reconciler`](../../company/domains/product-operations/platform/agents/billing-reconciler.yaml) (human-gated), [`growth-experiment-runner`](../../company/domains/sales-marketing/growth/agents/growth-experiment-runner.yaml) (human-gated).

---

## Required fields

### `apiVersion`, `kind`, `name`, `module`, `purpose`

Same shape as Manifest. `module:` is the **owning module's path** and must match the module that declares this agent in its `agents[]` block. If the agent says it belongs to `company/domains/x/y` but `company/domains/x/y/manifest.yaml` doesn't list it, regenerating the agent catalogue surfaces the mismatch.

### `cadence` and `schedule`

Two fields. They are not the same thing.

| Field | Meaning |
|---|---|
| `cadence` | The conceptual frequency — `realtime`, `minutely`, `hourly`, `daily`, `weekly`, `monthly`, `on-demand`, `event-driven` |
| `schedule` | The mechanical when — a cron expression or the literal string `on-demand` |

`cadence: daily, schedule: "0 7 * * *"` is consistent. `cadence: on-demand, schedule: "0 0 * * *"` is a contradiction and the runtime would refuse to start the agent.

For agents in autonomy class `human-gated`, `schedule: on-demand` is the only valid value. The runtime rejects scheduled triggers on human-gated agents at validation time.

### `autonomy`

One of: `autonomous | human-gated | escalated`. The most important field on the agent. The runtime enforces this — see [`/company/runtime/autonomy-policy.yaml`](../../company/runtime/autonomy-policy.yaml).

| Class | Use when | Examples |
|---|---|---|
| `autonomous` | Read-only or fully reversible operations | cash-forecaster, identity-drift-detector |
| `human-gated` | Writes to external systems, financial actions, communications | billing-reconciler, growth-experiment-runner |
| `escalated` | Fires up to a threshold, then escalates | deploy-watchdog |

For `escalated`, the `escalation` block is **required**:

```yaml
autonomy: escalated
escalation:
  threshold: "3 consecutive failures within 30 minutes"
  to: people:platform-lead
```

The cross-document validator rejects `escalated` without `escalation`.

---

## Inputs and outputs

```yaml
inputs:
  - name: ledger-entries
    type: ledger-entry
    from: company/domains/finance-ops/finance:ledger-summary

outputs:
  - name: cash-forecast
    type: cash-forecast
    emitsEvent: finance.cash_forecast_updated
```

Inputs reference interfaces by `<module>:<interface>`. The producer module must `exposes` the named interface.

Outputs with `emitsEvent` connect the agent to the typed event ledger. The event type must exist in [`/company/events/event-types.yaml`](../../company/events/event-types.yaml). New event types follow the schema-migration standard.

---

## Tools, skills, and memory

```yaml
tools:
  - canonical-ledger-reader
  - pipeline-reader

skills:
  - sync-verification
  - resolve-drift

memoryScope: company/memory/cash-forecaster
```

- `tools[]` — named runtime capabilities the agent uses. Vendor-neutral.
- `skills[]` — Tier-3 skills the agent is authorized to invoke. The cross-document validator rejects references to undefined skills.
- `memoryScope` — pointer into [`/company/memory/`](../../company/memory). The agent reads its own MEMORY.md index at invocation time.

---

## Observability

```yaml
observability:
  dashboards:
    - finance-overview
  alerts:
    - cash-forecast-stale
  auditTopic: cash-forecaster
```

Every agent declares an `auditTopic` — this is mandatory by convention (and worth promoting to schema-required in a future bump). The audit topic is the queryable namespace under which the agent's runtime audit records land.

`dashboards[]` and `alerts[]` are references; the dashboard YAMLs in [`/company/dashboards/`](../../company/dashboards) and the alert rules referenced by name must exist.

---

## Invariants

Same shape as module invariants — single-sentence assertions about the agent's behavior. The runtime references these in refusals.

Required invariants for almost every agent:

- "Writes an audit record on every invocation."
- For agents touching external systems: "Read-only against `<system>`." or "No autonomous writeback."
- For agents emitting events: "Emits `<event>` only when `<condition>`." (Prevents the event ledger from getting noisy.)

---

## Primary users and contacts

```yaml
primaryUsers:
  - cfo
  - finance-lead

contacts:
  - role: accountable
    person: finance-lead
```

`primaryUsers[]` is **role-or-id strings** (not objects). The schema requires strings here. The roles get resolved against [`/company/integrations/seeds/`](../../company/integrations/seeds) at runtime.

`contacts[]` follows the same shape as module contacts. At least one accountable contact is best-practice (not yet schema-required for agents).

---

## Generated outputs for this agent

Once an agent is declared and validation passes, `npm run generate` emits:

- Row in [`/generated/agent-catalogue.json`](../../generated/agent-catalogue.json)
- Per-agent context bundle at `/generated/context-bundles/<module-slug>__<agent>.json` — typed runtime context with resolved read/write access, tools, canonical events, HITL constraints, observability surfaces

The context bundle is what the agent **actually reads** at invocation time. Spot-check it after editing the agent declaration:

```bash
cat generated/context-bundles/company_domains_finance-ops_finance__cash-forecaster.json
```

---

## Common review failures

1. **`autonomy: escalated` without an `escalation` block** — caught by the cross-document validator.
2. **Schedule on `human-gated`** — rejected at validation. If the agent has to run on a clock, the autonomy class is wrong.
3. **No `auditTopic`** — accepted by current schema, but every reviewer should ask "where do this agent's audit rows land?"
4. **Missing typed event when output mutates state** — an output that changes external state should `emitsEvent`. Otherwise the event ledger is incomplete.
5. **Vendor name in `runtime`** — `runtime: openai-gpt-4o` is wrong; `runtime: llm` is right. The framework is vendor-neutral.
6. **`skills:` referencing names that don't exist** — caught by the validator. Add the skill or remove the reference.

---

## Promoting an agent from human-gated to autonomous

This is a deliberate operational change, not a code edit. The procedure:

1. Accumulate ≥3 successful invocations through the [`sync-verification`](../../company/skills/sync-verification.yaml) skill on the path being promoted. Each invocation leaves a correlation ID in the audit log.
2. Open an ADR citing those correlation IDs and describing the failure modes that have been observed (and bounded).
3. Update the agent's `autonomy` field in the same PR as the ADR.
4. Validate, regenerate, ship.

Demoting from autonomous → human-gated is free; no ADR required. The asymmetry is intentional.

---

## Related

- Skill: [`add-agent`](../../company/skills/add-agent.yaml)
- Policy: [`/company/policies/hitl-external-writes.md`](../../company/policies/hitl-external-writes.md)
- Standard: [`/docs/standards/observability.md`](../standards/observability.md)
