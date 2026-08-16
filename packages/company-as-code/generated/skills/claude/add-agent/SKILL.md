---
name: add-agent
description: "Add an autonomous unit to an existing module with the correct autonomy classification, escalation block if needed, and observability surface."
---

# Add an agent

Use this skill to declare a new autonomous unit inside an existing module.
Every agent declares purpose, runtime, schedule, cadence, and autonomy.
The runtime enforces the autonomy classification, schedules on a
`human-gated` agent fail validation.

## When to use

- You are about to wire a new scheduled job, event handler, or AI runtime.
- You are formalizing a previously-manual procedure as an autonomous unit.

## Inputs

- `modulePath`: the module that will own the agent (must already have a manifest).
- `agentName`: kebab-case, unique within the owning module.
- `autonomy`: `autonomous`, `human-gated`, or `escalated`.

## Choosing autonomy

- **`autonomous`**: read-only syncs, validation passes, registry generation,
  drift detection, reporting roll-ups.
- **`human-gated`**: writes to external systems, financial actions,
  communications to customers, anything that mutates real-world state with
  durable consequences.
- **`escalated`**: retries within an error budget, event-driven incident
  detectors, anything that should auto-handle up to a threshold and then
  page a human. Requires a populated `escalation` block.

When in doubt: pick the more restrictive class. Promoting to autonomous
requires recorded reliability evidence; demoting is free.

## Steps

1. **Copy the template.**
   ```bash
   mkdir -p <modulePath>/agents
   cp templates/agent.yaml <modulePath>/agents/<agentName>.yaml
   ```

2. **Fill in the agent file.**
   - `name`, `module`, `purpose` (one sentence)
   - `runtime`: abstract label (`llm`, `scheduled-job`, `event-handler`); no vendor names
   - `schedule`: cron expression or `on-demand`
   - `cadence`: `realtime | minutely | hourly | daily | weekly | monthly | on-demand | event-driven`
   - `autonomy`: as decided above
   - If `escalated`: fill in `escalation.threshold` and `escalation.to`.
   - `inputs`, `outputs`, typed payloads with optional `from:` / `emitsEvent:`
   - `observability.auditTopic`: required for every agent
   - `invariants`: at minimum: "Writes an audit record on every invocation."

3. **Declare the agent in the owning module's manifest** under `agents:`.
   The manifest entry is a summary; the standalone agent file is the source of truth.

4. **Validate.**
   ```bash
   cd cli && npm run validate
   ```

5. **Regenerate.**
   ```bash
   npm run generate
   ```
   The agent now appears in `/generated/agent-catalogue.json` and a new
   `/generated/context-bundles/<module>__<agent>.json` is emitted.

6. **Drift gate.**
   ```bash
   npm run generate:check
   ```

## Definition of done

- [ ] `<modulePath>/agents/<agentName>.yaml` exists and validates
- [ ] Manifest agent list updated
- [ ] If `escalated`: escalation block populated
- [ ] Agent declares an `auditTopic`
- [ ] Agent declares at least one invariant
- [ ] `npm run validate` is green
- [ ] `npm run generate:check` is green

## Failure handling

- **`autonomy=escalated requires an escalation block`**: fill in `escalation.threshold` and `escalation.to`, then re-validate.
- **Cron expression rejected**: use 5-field cron or the literal string `on-demand`.
- **Manifest agent list mismatches standalone file**: the standalone file wins;
  fix the manifest summary to match.
- **Drift gate fails on the context bundle**: run `npm run generate` and commit.

## Related

- Skill: `add-module`: prerequisite if the owning module doesn't exist yet.
- Skill: `sync-verification`: apply before promoting a `human-gated` agent to `autonomous`.
- Standard: `/docs/standards/observability.md`.
