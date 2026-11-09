# Anatomy of the Runtime Host

The TypeScript CLI under `/cli` is the **dev-side** tool: it validates manifests, generates registries, and gates drift. The runtime host under `/runtime` is the **ops-side** tool: it loads the same manifests at execution time, runs workflows, and persists what happened.

This doc is the field-by-field walkthrough for the host. The reference implementation is in TypeScript so the rest of the framework's discipline applies; forks needing production performance can port to Go/Rust with the same schemas as the contract.

---

## What the host owns

- **Loading the manifest graph.** Walks `/company/**/*.yaml`, indexes workflows / agents / automations / event-type registry.
- **Executing workflows.** Walks `steps[]` in declared order, dispatching each step kind to a pluggable invoker.
- **Persisting audit + event records.** Append-only stores behind two interfaces (`AuditSink` / `EventSink`); reference backends ship for SQLite and Postgres.
- **Enforcing execution-time invariants.** The ones the static validator can't catch. Most importantly, that a `live-write` is preceded by a dry-run audit row under the same correlation ID.

## What the host does NOT own

- **Real external calls.** The `AgentInvoker`, `AutomationInvoker`, and `ApprovalProvider` interfaces are extension points. Reference implementations are deliberately minimal.
- **Authz.** Trusted-input today; the next PR adds RBAC/ABAC.
- **Daemon lifecycle.** The host is a CLI. Forks wrap it.
- **Coordination across nodes.** The reference implementation is single-process; multi-node coordination is a fork concern.

## Storage interfaces

Two small interfaces, both append-only by convention:

```typescript
interface AuditSink {
  record(row: AuditRecord): Promise<void>;
  byCorrelation(correlationId: string): Promise<AuditRecord[]>;
  ready(): Promise<boolean>;
  close(): Promise<void>;
}

interface EventSink {
  emit(event: TypedEvent): Promise<void>;
  byEntity(canonicalId: string, opts?: { limit?: number }): Promise<TypedEvent[]>;
  byType(type: string, opts?: { limit?: number }): Promise<TypedEvent[]>;
  ready(): Promise<boolean>;
  close(): Promise<void>;
}
```

These interfaces never expose UPDATE or DELETE. Append-only is a property of the contract, not just the underlying store. Forks adding a third backend (Kafka, NATS, cloud-streaming) implement exactly these two surfaces.

## Reference backends

### SQLite (`SqliteSinks`)

- Zero-config: pass a file path or `:memory:` for tests
- WAL journal mode for sane crash semantics
- Indexes on `correlation_id`, `entity_canonical_id`, `type`
- Best fit: local development, single-node ops, CI tests

### Postgres (`PostgresSinks`)

- Multi-node, durable, production-grade
- JSONB columns for payloads
- Connection-pool managed by `pg`; constructor accepts a `pg.PoolConfig` or a connection string
- First connection auto-creates the schema; production forks should manage migrations

## Execution-time invariants

The validator at the dev edge catches schema and cross-document discipline failures. The host catches the ones that only manifest at execution time:

### 1. HITL workflows cannot have scheduled triggers

```typescript
if (workflow.hitl === true && workflow.trigger.kind === "schedule") {
  throw new Error(`refuses to execute: hitl: true with trigger.kind=schedule`);
}
```

Checked at load. Throws rather than refusing-per-step because the workflow is structurally invalid.

### 2. Live-write requires a prior dry-run in the same correlation

```typescript
if (step.kind === "live-write" && !ctx.dryRun) {
  const prior = await audit.byCorrelation(ctx.correlationId);
  const hasDryRun = prior.some(r => r.dryRun === true && r.targetSystem === step.automation);
  if (!hasDryRun) return fail(`live-write '${automation}' refuses without a prior dry-run`);
}
```

This is the safety rail. The dry-run audit row is the evidence that someone reviewed the projected payload before this run. Without it, the live-write step fails (not retries).

### 3. Emit-event requires a registered type

```typescript
if (eventTypes.size > 0 && !eventTypes.has(step.emitsEvent)) {
  return fail(`event type '${type}' is not in the EventTypeRegistry`);
}
```

When a registry has been loaded. Forks running without a registry are unconstrained; forks running with one cannot emit free-text event types.

### 4. Every step writes an audit row

Even failures. Even refusals. The audit log is the contract for "what did we do?", and silence is a failure mode.

## The correlation-ID narrative

Every workflow execution gets a unique correlation ID (the workflow name + a ULID). Every audit row, every event, every approval, every dry-run, every live-write under that execution carries the same ID. Querying by correlation returns the full narrative in time order:

```
$ cac-host audit month-end-close-01krgc39wjnwas4pexecztdvmr

2026-05-13T09:53:42.802Z  success   workflow.started   person:people:finance-lead
2026-05-13T09:53:42.803Z  success   step.agent         system:runtime-host
2026-05-13T09:53:42.803Z  dry-run   step.dry-run       system:runtime-host
2026-05-13T09:53:42.804Z  success   human-approval     person:test:auto-approver
2026-05-13T09:53:42.804Z  dry-run   step.live-write    system:runtime-host
2026-05-13T09:53:42.805Z  success   step.agent         system:runtime-host
2026-05-13T09:53:42.805Z  success   workflow.completed system:runtime-host
```

This narrative is what makes the runtime defensible. Incident retros write themselves; compliance audits read directly from this surface; agents can reason about what happened to a given entity in time-order without anyone exporting a CSV.

## Pluggable invokers

Three interfaces forks override:

- **`AgentInvoker`**: calls into the fork's AI runtime. The reference invoker is read-only and returns the agent's declared inputs/outputs so the executor pathway exercises end-to-end.
- **`AutomationInvoker`**: performs the actual mutation against the integration. The reference invoker computes a projection without external calls; forks replace with their integration client.
- **`ApprovalProvider`**: the human-approval surface. Reference providers: `InteractiveApprovalProvider` (stdin prompt) and `AutoApprovalProvider` (tests).

Each interface returns the data the audit log needs. Forks don't have to reinvent the audit shape, they just satisfy the interface.

## Related

- [`/runtime/README.md`](../../runtime/README.md), quick start and commands
- [`/docs/scenarios/monthly-close.md`](../scenarios/monthly-close.md). The worked scenario this runtime executes end-to-end
- [`/docs/roadmap.md`](../roadmap.md), what's coming next (authz, integration controllers)
- [`/docs/anatomy/workflow.md`](./workflow.md), the schema the runtime executes
