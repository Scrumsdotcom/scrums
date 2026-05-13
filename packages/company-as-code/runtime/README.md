# /runtime

Reference **runtime host** for Company-as-Code. Loads the manifest graph, executes workflows, persists audit + event records.

Where the [`/cli`](../cli) is the **dev-side** tool (validate manifests, generate registries, drift gate), the runtime host is the **ops-side** tool (load manifests at startup, run workflows on demand, persist what happened). Two distinct roles; the schemas are shared.

## Quick start

```bash
cd runtime
npm install
npm run start -- load --repo ..
npm run start -- execute month-end-close \
  --repo .. \
  --input period=2026-04 \
  --trigger-actor people:finance-lead \
  --auto-approve
npm run start -- audit <correlationId> --db ./runtime.db
npm run start -- events --type finance.period_closed --db ./runtime.db
```

## Commands

| Command | Purpose |
|---|---|
| `cac-host load` | Load and validate the manifest graph; print counts. |
| `cac-host execute <workflow>` | Execute a workflow. Defaults to dry-run-only; `--live` enables live writes. |
| `cac-host audit <correlationId>` | Print the audit narrative for one execution, in time order. |
| `cac-host events --type <name>` | Print typed events of a given type. |
| `cac-host events --entity <canonicalId>` | Print typed events for an entity. |

Global flags:
- `--repo <path>` — repository root (or set `RUNTIME_REPO`)
- `--db <path>` — SQLite file (or set `RUNTIME_DB`); defaults to `./runtime.db`

## What the runtime enforces at execution time

The TypeScript CLI validates the manifest graph statically. The runtime host enforces a different set of invariants — the ones that only manifest at execution time:

- **`hitl: true` + `trigger.kind: schedule` is refused.** The runtime throws at workflow load.
- **`live-write` requires a prior dry-run audit row in the same correlation.** The runtime checks the audit log before any live mutation; the step fails (not retries) if missing.
- **`emit-event` rejects types not in the EventTypeRegistry.** When a registry is loaded.
- **Every step writes an audit row.** Including refusals.
- **State transitions emit typed events.** Events carry the correlation ID; the audit log captures the action.

These rails make the runtime defensible without a humans-staring-at-dashboards layer.

## Storage backends

Two reference implementations behind a common `AuditSink` / `EventSink` interface:

| Backend | Use case | Configuration |
|---|---|---|
| **SQLite** (`SqliteSinks`) | Zero-config local development, single-node ops, CI tests | `--db <path>` or `:memory:` |
| **Postgres** (`PostgresSinks`) | Production, multi-node, durable storage | Pass a `pg.PoolConfig` or connection string |

Both backends speak append-only by convention. The interface never exposes UPDATE or DELETE. Schema is auto-created on first connection; production forks should manage migrations through their own tooling.

Forks add a third backend (Kafka, NATS, cloud-streaming services, anything) by implementing the two interfaces in `src/sinks/types.ts`.

## Workflow executor

The executor walks `steps[]` in declared order, handling each kind:

| `kind` | Behavior |
|---|---|
| `agent` | Calls the registered `AgentInvoker`. Reference invoker is read-only and returns the agent's declared inputs/outputs. |
| `automation` / `dry-run` / `live-write` | Calls the registered `AutomationInvoker`. Dry-run computes a projection without external mutation; live-write requires a prior dry-run audit row. |
| `human-approval` | Calls the registered `ApprovalProvider`. The reference `InteractiveApprovalProvider` prompts on stdin; `AutoApprovalProvider` approves immediately (tests). |
| `emit-event` | Emits a typed event to the configured `EventSink`. Rejects types not in the registry. |
| `wait` | Records the wait audit row and proceeds. Forks plug in real polling. |
| `branch` | Records the branch decision. The reference implementation always takes the first branch; forks plug in their own `when` evaluator. |
| `external-call` | Recorded as `skipped` in the reference runtime. Forks replace with their integration client. |

## Pluggable contracts

Three interfaces forks override (`src/executor/runner.ts`):

```typescript
interface AgentInvoker {
  invoke(args: { agent: string; correlationId: string; dryRun: boolean; repo: RepoIndex; })
    : Promise<{ output: unknown; emittedEvent?: TypedEvent }>;
}

interface AutomationInvoker {
  invoke(args: { automation: string; correlationId: string; dryRun: boolean; inputs: Record<string, unknown>; repo: RepoIndex; })
    : Promise<{ projection: unknown; emittedEvent?: TypedEvent }>;
}

interface ApprovalProvider {
  prompt(args: { correlationId: string; workflow: string; step: WorkflowStep; audit: AuditSink; triggerActor: string; })
    : Promise<{ approved: boolean; approver: string; reason?: string }>;
}
```

The reference invokers in `src/executor/reference-invokers.ts` are deliberately minimal — they exercise the executor pathway without performing real external work. Forks replace them with implementations that call their actual AI runtime, automation framework, and approval UI.

## Two CLIs, one repo

| | `/cli` (dev-side) | `/runtime` (ops-side) |
|---|---|---|
| When to run | Authoring manifests, opening PRs, CI gates | Running workflows in dev / staging / prod |
| Reads | The whole `/company/**` corpus | The same corpus, plus a SQLite/Postgres database |
| Writes | `/generated/` only | Audit log + event ledger |
| Side effects | None (deterministic) | Yes (real execution, real persistence) |
| Required for forks | Yes (correctness gate) | Optional (forks may swap in their own runtime) |

## Limits (out of scope for this reference)

- **No real external calls.** `agent` / `automation` / `external-call` step kinds use reference invokers that don't reach real systems. Forks plug in real clients.
- **No daemon mode.** The host is a CLI that exits after each command. Forks wrap it in their own daemon (systemd, Kubernetes, etc.).
- **No multi-node coordination.** SQLite is single-process; Postgres is multi-node but the reference host does not coordinate concurrent executions of the same workflow.
- **No authz enforcement.** The next PR adds RBAC/ABAC. For now, the host trusts the `--trigger-actor` and the `ApprovalProvider`'s claimed approver ID.
- **No metrics export.** Forks plug in Prometheus / OpenTelemetry / anything.

See [`/docs/roadmap.md`](../docs/roadmap.md) for what's coming.
