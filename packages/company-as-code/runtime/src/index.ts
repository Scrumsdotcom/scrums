#!/usr/bin/env node
import path from "node:path";
import fs from "node:fs/promises";
import { loadRepo } from "./loader/repo.js";
import { SqliteSinks } from "./sinks/sqlite.js";
import { WorkflowExecutor } from "./executor/runner.js";
import {
  AutoApprovalProvider,
  InteractiveApprovalProvider,
  ReferenceAgentInvoker,
  ReferenceAutomationInvoker,
} from "./executor/reference-invokers.js";
import { initTracing, shutdownTracing, runInSpan } from "./observability/tracing.js";
import { SqliteStateStore } from "./state/store.js";
import { SqliteHitlInbox } from "./hitl/inbox.js";
import { QueuedApprovalProvider } from "./hitl/queued-approval.js";
import { startInboxServer } from "./hitl/server.js";
import { startCognitionServer } from "./cognition/server.js";
import { SqliteShadowStore } from "./shadow/evidence-store.js";
import { ShadowAgentInvoker } from "./shadow/shadow-invoker.js";
import { loadAutonomyPolicy, evaluatePromotion } from "./shadow/evaluate.js";
import { nextAdrNumber, generateAdrProposal } from "./shadow/adr-proposal.js";
import { ulid } from "ulid";
import type { AuditRecord, TypedEvent } from "./types.js";

interface ParsedArgs {
  command: string;
  rest: string[];
  flags: Map<string, string | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const [, , command, ...rest] = argv;
  const flags = new Map<string, string | boolean>();
  const positional: string[] = [];
  for (let i = 0; i < rest.length; i += 1) {
    const a = rest[i];
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=", 2);
      if (v !== undefined) {
        flags.set(k, v);
      } else if (rest[i + 1] && !rest[i + 1].startsWith("--")) {
        flags.set(k, rest[i + 1]);
        i += 1;
      } else {
        flags.set(k, true);
      }
    } else {
      positional.push(a);
    }
  }
  return { command: command ?? "help", rest: positional, flags };
}

function help(): void {
  console.log(
    `Company-as-Code runtime host

Usage:
  cac-host load                                Validate the manifest graph and exit.
  cac-host execute <workflow> [options]        Execute a workflow.
  cac-host audit <correlationId>               Print the audit narrative for a correlation.
  cac-host events --type <type>                Print typed-event rows of a given type.
  cac-host events --entity <canonicalId>       Print typed-event rows for an entity.
  cac-host trace <traceId>                     Print the unified audit + event timeline for a trace.
  cac-host state register-entity [options]     Issue a canonical entity (canonical IDs are permanent).
  cac-host state map [options]                 Map a canonical entity to an external system ID.
  cac-host state list                          Print the live canonical state (entities + mappings).
  cac-host snapshot create [--label <label>]   Checkpoint the entire canonical state.
  cac-host snapshot list                       List state snapshots oldest-first.
  cac-host snapshot show <snapshotId>          Print a snapshot's full content.
  cac-host snapshot rollback <snapshotId>      Atomically restore canonical state to a snapshot.
  cac-host inbox list                          List HITL approvals (pending first).
  cac-host inbox show <itemId>                 Show one inbox item with its dry-run projection.
  cac-host inbox approve <itemId> [options]    Approve a pending inbox item.
  cac-host inbox reject <itemId> [options]     Reject a pending inbox item.
  cac-host inbox serve [--port <n>]            Serve the HITL dashboard (default port 4000).
  cac-host graph serve [--port <n>]            Serve the Visual Cognition Graph (default port 4100).
  cac-host shadow enroll <agent>               Enroll an agent in Shadow Mode (perpetual dry-run).
  cac-host shadow withdraw <agent>             Remove an agent from Shadow Mode.
  cac-host shadow list                         List shadow enrollments with evidence summaries.
  cac-host shadow status <agent>               Show an agent's reliability evidence + promotion gate.
  cac-host shadow observe <agent> [options]    Record a human-comparison observation on a shadow run.
  cac-host shadow propose <agent> [--write]    Draft an ADR promoting a shadow agent to autonomous.

Options for 'shadow observe':
  --matched <true|false>    Did the agent's projection match the human action? Required.
  --run <runId>             Target a specific shadow run. Defaults to the most recent un-observed run.

Options for 'inbox approve' / 'inbox reject':
  --approver <canonicalId>  Canonical Person ID of the human deciding. Required.
  --reason <text>           Decision reason. Required for reject, optional for approve.

Options for 'state register-entity':
  --id <canonicalId>        Permanent internal ID. Required.
  --kind <kind>             Canonical entity type, e.g. 'customer'. Required.
  --bucket <l1Bucket>       L1 lifecycle bucket on the canonical state ladder. Required.

Options for 'state map':
  --id <canonicalId>        Canonical entity to map. Required.
  --system <name>           External system canonical name, e.g. 'crm'. Required.
  --external-id <id>        The ID that external system assigned. Required.

Options for 'execute':
  --module <path>           Owning module path. Required when workflow name is ambiguous.
  --input <name>=<value>    Add a workflow input. May repeat.
  --trigger-actor <id>      Canonical Person ID. Defaults to system:operator.
  --live                    Allow live-writes. Default is dry-run-only.
  --auto-approve            Bypass interactive approval (tests / CI).
  --queue-approvals         Route human-approval steps through the HITL inbox
                            instead of the interactive stdin prompt.

Global options:
  --repo <path>             Repository root. Defaults to cwd.
  --db <path>               SQLite file. Defaults to ./runtime.db.

Environment:
  RUNTIME_DB                Overrides --db.
  RUNTIME_REPO              Overrides --repo.
  CAC_TRACE_CONSOLE=1       Export OpenTelemetry spans to the console.
  OTEL_EXPORTER_OTLP_ENDPOINT  Recognised by the OpenTelemetry SDK; add an
                            OTLP exporter in a fork to ship spans to a collector.

Exit codes:
  0  success
  1  command-line / load-time error
  2  workflow halted at a step
`,
  );
}

async function main(): Promise<void> {
  // Register the OpenTelemetry tracer provider before anything that may open
  // a span. Idempotent and silent unless an exporter is configured.
  initTracing();
  const args = parseArgs(process.argv);
  const repoRoot = path.resolve(
    String(args.flags.get("repo") ?? process.env.RUNTIME_REPO ?? process.cwd()),
  );
  const dbPath = String(args.flags.get("db") ?? process.env.RUNTIME_DB ?? "./runtime.db");

  switch (args.command) {
    case "help":
    case "--help":
    case "-h":
      help();
      return;

    case "load": {
      const repo = await loadRepo(repoRoot);
      console.log(
        `✓ loaded: ${repo.workflows.size} workflows, ${repo.agents.size} agents, ${repo.automations.size} automations, ${repo.eventTypes.size} registered event types.`,
      );
      return;
    }

    case "execute": {
      const name = args.rest[0];
      if (!name) {
        console.error("execute: missing workflow name");
        process.exit(1);
      }
      const live = args.flags.get("live") === true;
      const autoApprove = args.flags.get("auto-approve") === true;
      const queueApprovals = args.flags.get("queue-approvals") === true;
      const triggerActor = String(args.flags.get("trigger-actor") ?? "system:operator");
      const moduleFlag = args.flags.get("module");
      const inputs: Record<string, unknown> = {};
      // --input may appear multiple times; argv flatten loses repeats. Recover from raw argv.
      for (let i = 0; i < process.argv.length; i += 1) {
        if (process.argv[i] === "--input" && process.argv[i + 1]) {
          const [k, v] = process.argv[i + 1].split("=", 2);
          if (k && v !== undefined) inputs[k] = v;
        }
      }

      const repo = await loadRepo(repoRoot);
      const candidates = repo.workflowsByName(name);
      if (candidates.length === 0) {
        console.error(`execute: no workflow named '${name}' found in ${repoRoot}/company`);
        process.exit(1);
      }
      let workflow = candidates[0];
      if (candidates.length > 1) {
        if (!moduleFlag) {
          console.error(
            `execute: workflow name '${name}' is ambiguous; matches:\n${candidates.map((c) => `  - ${c.module}::${c.name} (${c._file})`).join("\n")}\nDisambiguate with --module <path>.`,
          );
          process.exit(1);
        }
        const match = candidates.find((c) => c.module === String(moduleFlag));
        if (!match) {
          console.error(`execute: no workflow '${name}' under module '${String(moduleFlag)}'`);
          process.exit(1);
        }
        workflow = match;
      }

      const sinks = new SqliteSinks(dbPath);
      const inbox = queueApprovals ? new SqliteHitlInbox(dbPath) : undefined;
      const approval = autoApprove
        ? new AutoApprovalProvider()
        : inbox
          ? new QueuedApprovalProvider(inbox)
          : new InteractiveApprovalProvider();
      // Shadow Mode is automatic: agents enrolled in shadow mode are forced to
      // dry-run and their projections recorded as reliability evidence. For
      // agents that are not enrolled the wrapper is a transparent pass-through.
      const shadowStore = new SqliteShadowStore(dbPath);
      const executor = new WorkflowExecutor({
        audit: sinks.audit(),
        events: sinks.events(),
        approval,
        agents: new ShadowAgentInvoker(new ReferenceAgentInvoker(), shadowStore),
        automations: new ReferenceAutomationInvoker(),
        repo,
      });

      try {
        const { ctx, results } = await executor.run({
          workflow,
          inputs,
          triggerActor,
          dryRunOnly: !live,
        });
        console.log(`\n── execution complete ──`);
        console.log(`workflow:      ${workflow.module}::${workflow.name}`);
        console.log(`correlationId: ${ctx.correlationId}`);
        console.log(`mode:          ${ctx.dryRun ? "dry-run" : "live"}`);
        console.log(`steps:`);
        for (const r of results) {
          console.log(`  - ${r.stepId}: ${r.status}${r.message ? `, ${r.message}` : ""}`);
        }
        const halted = results.some((r) => r.status === "failure" || r.status === "blocked");
        if (halted) process.exit(2);
      } catch (err) {
        console.error(`execute: ${(err as Error).message}`);
        process.exit(1);
      } finally {
        sinks.close();
        inbox?.close();
        shadowStore.close();
      }
      return;
    }

    case "audit": {
      const id = args.rest[0];
      if (!id) {
        console.error("audit: missing correlationId");
        process.exit(1);
      }
      const sinks = new SqliteSinks(dbPath);
      try {
        const rows = await sinks.audit().byCorrelation(id);
        if (rows.length === 0) {
          console.log(`(no audit rows for correlationId ${id})`);
          return;
        }
        for (const r of rows) {
          console.log(
            `${r.startedAt}  ${r.status.padEnd(9)} ${r.dryRun ? "[dry-run] " : ""}${r.action.padEnd(28)} ${r.actor.kind}:${r.actor.id}`,
          );
        }
      } finally {
        sinks.close();
      }
      return;
    }

    case "events": {
      const type = args.flags.get("type") ? String(args.flags.get("type")) : null;
      const entity = args.flags.get("entity") ? String(args.flags.get("entity")) : null;
      if (!type && !entity) {
        console.error("events: requires --type <name> or --entity <canonicalId>");
        process.exit(1);
      }
      const sinks = new SqliteSinks(dbPath);
      try {
        const rows = type
          ? await sinks.events().byType(type)
          : await sinks.events().byEntity(entity!);
        if (rows.length === 0) {
          console.log("(no events)");
          return;
        }
        for (const e of rows) {
          console.log(
            `${e.occurredAt}  ${e.type.padEnd(48)} entity=${e.entity.canonicalId} corr=${e.correlationId ?? "-"}`,
          );
        }
      } finally {
        sinks.close();
      }
      return;
    }

    case "trace": {
      const id = args.rest[0];
      if (!id) {
        console.error("trace: missing traceId");
        process.exit(1);
      }
      const sinks = new SqliteSinks(dbPath);
      try {
        const auditRows = await sinks.audit().byTrace(id);
        const eventRows = await sinks.events().byTrace(id);
        if (auditRows.length === 0 && eventRows.length === 0) {
          console.log(`(no audit rows or events for traceId ${id})`);
          return;
        }
        // Interleave the two ledgers by timestamp. This is the whole point
        // of the trace ID: the audit log ("what we did") and the event
        // ledger ("what happened") become one timeline.
        type Line = { at: string; ledger: "audit" | "event"; text: string };
        const lines: Line[] = [];
        for (const r of auditRows) {
          lines.push({
            at: r.startedAt,
            ledger: "audit",
            text: `${r.status.padEnd(9)} ${r.dryRun ? "[dry-run] " : ""}${r.action.padEnd(24)} ${r.actor.kind}:${r.actor.id}${r.spanId ? `  span=${r.spanId}` : ""}`,
          });
        }
        for (const e of eventRows) {
          lines.push({
            at: e.occurredAt,
            ledger: "event",
            text: `${"emitted".padEnd(9)} ${e.type.padEnd(34)} entity=${e.entity.canonicalId}${e.spanId ? `  span=${e.spanId}` : ""}`,
          });
        }
        lines.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
        console.log(`trace ${id}, ${auditRows.length} audit row(s), ${eventRows.length} event(s)\n`);
        for (const l of lines) {
          console.log(`${l.at}  ${l.ledger === "audit" ? "AUDIT" : "EVENT"}  ${l.text}`);
        }
      } finally {
        sinks.close();
      }
      return;
    }

    case "state": {
      const sub = args.rest[0];
      const store = new SqliteStateStore(dbPath);
      try {
        if (sub === "register-entity") {
          const id = flagStr(args, "id");
          const kind = flagStr(args, "kind");
          const bucket = flagStr(args, "bucket");
          if (!id || !kind || !bucket) {
            console.error("state register-entity: --id, --kind and --bucket are all required");
            process.exit(1);
          }
          const e = store.registerEntity({ canonicalId: id, kind, l1Bucket: bucket });
          console.log(`✓ canonical entity ${e.canonicalId} (${e.kind}, L1=${e.l1Bucket})`);
        } else if (sub === "map") {
          const id = flagStr(args, "id");
          const system = flagStr(args, "system");
          const externalId = flagStr(args, "external-id");
          if (!id || !system || !externalId) {
            console.error("state map: --id, --system and --external-id are all required");
            process.exit(1);
          }
          if (!store.getEntity(id)) {
            console.error(`state map: no canonical entity '${id}', register it first`);
            process.exit(1);
          }
          store.mapSystem({ canonicalId: id, system, externalId });
          console.log(`✓ mapping ${id} → ${system}:${externalId}`);
        } else if (sub === "list") {
          const entities = store.listEntities();
          const mappings = store.listMappings();
          console.log(`canonical entities (${entities.length}):`);
          for (const e of entities) {
            const tomb = e.tombstonedAt ? ` [tombstoned: ${e.tombstoneReason ?? ""}]` : "";
            console.log(`  ${e.canonicalId.padEnd(28)} ${e.kind.padEnd(16)} L1=${e.l1Bucket}${tomb}`);
          }
          console.log(`\nsystem mappings (${mappings.length}):`);
          for (const m of mappings) {
            console.log(`  ${m.canonicalId.padEnd(28)} → ${m.system}:${m.externalId}`);
          }
        } else {
          console.error(`state: unknown subcommand '${sub ?? ""}' (expected register-entity | map | list)`);
          process.exit(1);
        }
      } finally {
        store.close();
      }
      return;
    }

    case "snapshot": {
      const sub = args.rest[0];
      const store = new SqliteStateStore(dbPath);
      try {
        if (sub === "create") {
          const label = flagStr(args, "label");
          await runInSpan("snapshot.create", { "cac.snapshot.label": label ?? "" }, async (tc) => {
            const snap = store.createSnapshot(label);
            const sinks = new SqliteSinks(dbPath);
            try {
              await recordRuntimeAudit(sinks, tc.traceId, tc.spanId, {
                action: "state.snapshot_created",
                status: "success",
                output: snap,
              });
              await emitRuntimeEvent(sinks, tc.traceId, tc.spanId, {
                type: "coordination.state_snapshot_created",
                entityId: snap.id,
                entityKind: "state-snapshot",
                payload: { contentHash: snap.contentHash, entityCount: snap.entityCount, mappingCount: snap.mappingCount },
              });
            } finally {
              sinks.close();
            }
            console.log(`✓ snapshot ${snap.id}`);
            console.log(`  label:       ${snap.label ?? "(none)"}`);
            console.log(`  contentHash: ${snap.contentHash}`);
            console.log(`  captured:    ${snap.entityCount} entit(y/ies), ${snap.mappingCount} mapping(s)`);
            console.log(`  traceId:     ${tc.traceId}`);
          });
        } else if (sub === "list") {
          const snaps = store.listSnapshots();
          if (snaps.length === 0) {
            console.log("(no snapshots)");
            return;
          }
          for (const s of snaps) {
            console.log(
              `${s.createdAt}  ${s.id}  ${String(s.entityCount).padStart(4)}e ${String(s.mappingCount).padStart(4)}m  ${s.contentHash.slice(0, 12)}  ${s.label ?? ""}`,
            );
          }
        } else if (sub === "show") {
          const id = args.rest[1];
          if (!id) {
            console.error("snapshot show: missing snapshotId");
            process.exit(1);
          }
          const snap = store.getSnapshot(id);
          if (!snap) {
            console.error(`snapshot show: no snapshot '${id}'`);
            process.exit(1);
          }
          console.log(JSON.stringify({ apiVersion: "company-as-code/v1", kind: "StateSnapshot", ...snap }, null, 2));
        } else if (sub === "rollback") {
          const id = args.rest[1];
          if (!id) {
            console.error("snapshot rollback: missing snapshotId");
            process.exit(1);
          }
          await runInSpan("snapshot.rollback", { "cac.snapshot.id": id }, async (tc) => {
            let result;
            try {
              result = store.rollbackTo(id);
            } catch (err) {
              console.error(`snapshot rollback: ${(err as Error).message}`);
              process.exit(1);
            }
            const sinks = new SqliteSinks(dbPath);
            try {
              // The audit + event ledgers are append-only, never rewound.
              // The rollback is itself an event: history rolls forward.
              await recordRuntimeAudit(sinks, tc.traceId, tc.spanId, {
                action: "state.rolled_back",
                status: "success",
                output: {
                  toSnapshot: result.snapshot.id,
                  restoredEntities: result.restoredEntities,
                  restoredMappings: result.restoredMappings,
                  replacedHash: result.replacedHash,
                  restoredHash: result.snapshot.contentHash,
                },
              });
              await emitRuntimeEvent(sinks, tc.traceId, tc.spanId, {
                type: "coordination.state_rolled_back",
                entityId: result.snapshot.id,
                entityKind: "state-snapshot",
                payload: {
                  replacedHash: result.replacedHash,
                  restoredHash: result.snapshot.contentHash,
                },
              });
            } finally {
              sinks.close();
            }
            console.log(`✓ rolled back to snapshot ${result.snapshot.id}`);
            console.log(`  restored:    ${result.restoredEntities} entit(y/ies), ${result.restoredMappings} mapping(s)`);
            console.log(`  replaced:    ${result.replacedHash}`);
            console.log(`  restored to: ${result.snapshot.contentHash}`);
            console.log(`  traceId:     ${tc.traceId}`);
          });
        } else {
          console.error(`snapshot: unknown subcommand '${sub ?? ""}' (expected create | list | show | rollback)`);
          process.exit(1);
        }
      } finally {
        store.close();
      }
      return;
    }

    case "inbox": {
      const sub = args.rest[0];
      if (sub === "serve") {
        const port = Number(args.flags.get("port") ?? 4000);
        const inbox = new SqliteHitlInbox(dbPath);
        const running = await startInboxServer({ inbox, port });
        console.log(`HITL inbox dashboard listening on ${running.url}`);
        console.log(`  db:    ${dbPath}`);
        console.log(`  press Ctrl+C to stop.`);
        // The listening socket keeps the process alive; do not close here.
        return;
      }

      const inbox = new SqliteHitlInbox(dbPath);
      try {
        if (sub === "list") {
          const items = inbox.list();
          if (items.length === 0) {
            console.log("(inbox empty)");
            return;
          }
          const order = { pending: 0, approved: 1, rejected: 2 } as const;
          items.sort((a, b) => order[a.status] - order[b.status]);
          for (const it of items) {
            const tail =
              it.status === "pending"
                ? `awaiting ${it.approverRole}`
                : `${it.status} by ${it.resolvedBy ?? "?"}`;
            console.log(
              `${it.status.padEnd(9)} ${it.id}  ${it.module}::${it.workflow} [${it.stepId}]  ${tail}`,
            );
          }
        } else if (sub === "show") {
          const id = args.rest[1];
          if (!id) {
            console.error("inbox show: missing itemId");
            process.exit(1);
          }
          const it = inbox.get(id);
          if (!it) {
            console.error(`inbox show: no item '${id}'`);
            process.exit(1);
          }
          console.log(JSON.stringify(it, null, 2));
        } else if (sub === "approve" || sub === "reject") {
          const id = args.rest[1];
          if (!id) {
            console.error(`inbox ${sub}: missing itemId`);
            process.exit(1);
          }
          const approver = flagStr(args, "approver");
          const reason = flagStr(args, "reason");
          if (!approver) {
            console.error(`inbox ${sub}: --approver <canonical Person ID> is required`);
            process.exit(1);
          }
          if (sub === "reject" && !reason) {
            console.error("inbox reject: --reason is required");
            process.exit(1);
          }
          try {
            const it = inbox.resolve(id, { approved: sub === "approve", approver, reason });
            console.log(`✓ inbox item ${it.id} ${it.status} by ${it.resolvedBy}`);
          } catch (err) {
            console.error(`inbox ${sub}: ${(err as Error).message}`);
            process.exit(1);
          }
        } else {
          console.error(
            `inbox: unknown subcommand '${sub ?? ""}' (expected list | show | approve | reject | serve)`,
          );
          process.exit(1);
        }
      } finally {
        inbox.close();
      }
      return;
    }

    case "graph": {
      const sub = args.rest[0];
      if (sub !== "serve") {
        console.error(`graph: unknown subcommand '${sub ?? ""}' (expected serve)`);
        process.exit(1);
      }
      const port = Number(args.flags.get("port") ?? 4100);
      const running = await startCognitionServer({ repoRoot, dbPath, port });
      console.log(`Visual Cognition Graph listening on ${running.url}`);
      console.log(`  repo:  ${repoRoot}`);
      console.log(`  db:    ${dbPath}`);
      console.log(`  structure from ${repoRoot}/generated/cognition-graph.json`);
      console.log(`  press Ctrl+C to stop.`);
      // The listening socket keeps the process alive.
      return;
    }

    case "shadow": {
      const sub = args.rest[0];
      const store = new SqliteShadowStore(dbPath);
      try {
        if (sub === "enroll") {
          const agent = args.rest[1];
          if (!agent) {
            console.error("shadow enroll: missing agent name");
            process.exit(1);
          }
          // Confirm the agent is a real declared agent before enrolling.
          const repo = await loadRepo(repoRoot);
          if (!repo.agents.has(agent)) {
            console.error(
              `shadow enroll: no agent '${agent}' declared in ${repoRoot}/company. ` +
                `Known agents: ${[...repo.agents.keys()].sort().join(", ") || "(none)"}`,
            );
            process.exit(1);
          }
          await runInSpan("shadow.enroll", { "cac.agent": agent }, async (tc) => {
            const enrollment = store.enroll(agent);
            const sinks = new SqliteSinks(dbPath);
            try {
              await recordRuntimeAudit(sinks, tc.traceId, tc.spanId, {
                action: "shadow.enrolled",
                status: "success",
                output: { agent, enrolledAt: enrollment.enrolledAt },
              });
              await emitRuntimeEvent(sinks, tc.traceId, tc.spanId, {
                type: "coordination.agent_shadow_enrolled",
                entityId: agent,
                entityKind: "agent",
                payload: { enrolledAt: enrollment.enrolledAt },
              });
            } finally {
              sinks.close();
            }
            console.log(`✓ ${agent} enrolled in Shadow Mode (perpetual dry-run) at ${enrollment.enrolledAt}`);
            console.log(`  it will accumulate reliability evidence on every 'cac-host execute' run.`);
            console.log(`  traceId: ${tc.traceId}`);
          });
        } else if (sub === "withdraw") {
          const agent = args.rest[1];
          if (!agent) {
            console.error("shadow withdraw: missing agent name");
            process.exit(1);
          }
          try {
            const e = store.setStatus(agent, "withdrawn");
            console.log(`✓ ${agent} withdrawn from Shadow Mode (${e.statusChangedAt}). Evidence is retained.`);
          } catch (err) {
            console.error(`shadow withdraw: ${(err as Error).message}`);
            process.exit(1);
          }
        } else if (sub === "list") {
          const enrollments = store.listEnrollments();
          if (enrollments.length === 0) {
            console.log("(no agents enrolled in shadow mode)");
            return;
          }
          for (const e of enrollments) {
            const ev = store.evidence(e.agent);
            console.log(
              `${e.status.padEnd(10)} ${e.agent.padEnd(28)} ${ev.shadowDays}d  ` +
                `${ev.totalRuns} runs  ${ev.observedRuns} observed  ` +
                `${(ev.agreementRate * 100).toFixed(0)}% agreement`,
            );
          }
        } else if (sub === "status") {
          const agent = args.rest[1];
          if (!agent) {
            console.error("shadow status: missing agent name");
            process.exit(1);
          }
          let ev;
          try {
            ev = store.evidence(agent);
          } catch (err) {
            console.error(`shadow status: ${(err as Error).message}`);
            process.exit(1);
          }
          const policy = await loadAutonomyPolicy(repoRoot);
          const evaluation = evaluatePromotion(ev, policy);
          console.log(`Shadow Mode, ${agent}  [${ev.status}]`);
          console.log(`  enrolled:        ${ev.enrolledAt}`);
          console.log(`  shadowing for:   ${ev.shadowDays} day(s)`);
          console.log(`  total runs:      ${ev.totalRuns}`);
          console.log(`  observed runs:   ${ev.observedRuns}`);
          console.log(`  matched human:   ${ev.matchedRuns}`);
          console.log(`  agreement rate:  ${(ev.agreementRate * 100).toFixed(1)}%`);
          console.log(`  distinct traces: ${ev.distinctTraces}`);
          console.log(`\n  promotion gate (from AutonomyPolicy.promotion.fromHumanGatedToAutonomous):`);
          for (const r of evaluation.requirements) {
            if (r.kind === "auto") {
              console.log(
                `    [${r.met ? "✓" : " "}] ${r.key}  ${r.comparator} ${r.threshold}  (actual: ${r.actual})`,
              );
            } else if (r.kind === "manual") {
              console.log(`    [ ] ${r.key}  # manual: ${r.note}`);
            } else {
              console.log(`    [?] ${r.key}  # ${r.note}`);
            }
          }
          console.log(
            `\n  automated gate: ${evaluation.autoMet ? "MET. Run 'cac-host shadow propose " + agent + "'" : "NOT MET. Unmet: " + evaluation.unmetAuto.join(", ")}`,
          );
        } else if (sub === "observe") {
          const agent = args.rest[1];
          if (!agent) {
            console.error("shadow observe: missing agent name");
            process.exit(1);
          }
          const matchedRaw = flagStr(args, "matched");
          if (matchedRaw !== "true" && matchedRaw !== "false") {
            console.error("shadow observe: --matched <true|false> is required");
            process.exit(1);
          }
          const runId = flagStr(args, "run");
          try {
            const run = store.observe(agent, matchedRaw === "true", runId);
            console.log(
              `✓ recorded observation on shadow run ${run.id}: projection ${run.matchedHuman ? "MATCHED" : "DID NOT MATCH"} the human action`,
            );
          } catch (err) {
            console.error(`shadow observe: ${(err as Error).message}`);
            process.exit(1);
          }
        } else if (sub === "propose") {
          const agent = args.rest[1];
          if (!agent) {
            console.error("shadow propose: missing agent name");
            process.exit(1);
          }
          const write = args.flags.get("write") === true;
          let ev;
          try {
            ev = store.evidence(agent);
          } catch (err) {
            console.error(`shadow propose: ${(err as Error).message}`);
            process.exit(1);
          }
          const policy = await loadAutonomyPolicy(repoRoot);
          const evaluation = evaluatePromotion(ev, policy);
          if (!evaluation.autoMet) {
            console.error(
              `✗ shadow propose: ${agent} has not cleared the automated promotion gate.\n` +
                `  unmet: ${evaluation.unmetAuto.join(", ")}\n` +
                `  run 'cac-host shadow status ${agent}' for the full breakdown.`,
            );
            process.exit(1);
          }
          const repo = await loadRepo(repoRoot);
          const agentDecl = repo.agents.get(agent);
          const number = await nextAdrNumber(repoRoot);
          const today = new Date().toISOString().slice(0, 10);
          const proposal = generateAdrProposal({
            agent,
            agentModule: agentDecl?.module,
            evidence: ev,
            evaluation,
            number,
            today,
          });
          console.log(`shadow propose ${agent}, automated promotion gate MET`);
          console.log(`  ${write ? "WRITING" : "DRY-RUN, no file written"}: ${proposal.file}\n`);
          console.log(proposal.content);
          if (!write) {
            console.log(`\nRe-run with --write to create the ADR draft.`);
            return;
          }
          const abs = path.join(repoRoot, proposal.file);
          try {
            await fs.stat(abs);
            console.error(`✗ shadow propose: ${proposal.file} already exists. Refusing to overwrite.`);
            process.exit(1);
          } catch {
            /* good, does not exist */
          }
          await fs.mkdir(path.dirname(abs), { recursive: true });
          await fs.writeFile(abs, proposal.content, "utf8");
          await runInSpan("shadow.propose", { "cac.agent": agent }, async (tc) => {
            const sinks = new SqliteSinks(dbPath);
            try {
              await recordRuntimeAudit(sinks, tc.traceId, tc.spanId, {
                action: "shadow.promotion_proposed",
                status: "success",
                output: { agent, adr: proposal.file, evidence: ev },
              });
              await emitRuntimeEvent(sinks, tc.traceId, tc.spanId, {
                type: "coordination.agent_promotion_proposed",
                entityId: agent,
                entityKind: "agent",
                payload: { adr: proposal.file, agreementRate: ev.agreementRate },
              });
            } finally {
              sinks.close();
            }
            console.log(`\n✓ wrote ${proposal.file}`);
            console.log(`  next: review it, add a row to docs/adr/README.md, set the agent's manifest`);
            console.log(`        autonomy to 'autonomous', and merge. traceId: ${tc.traceId}`);
          });
        } else {
          console.error(
            `shadow: unknown subcommand '${sub ?? ""}' (expected enroll | withdraw | list | status | observe | propose)`,
          );
          process.exit(1);
        }
      } finally {
        store.close();
      }
      return;
    }

    default: {
      console.error(`unknown command: ${args.command}`);
      help();
      process.exit(1);
    }
  }
}

function flagStr(args: ParsedArgs, key: string): string | undefined {
  const v = args.flags.get(key);
  return typeof v === "string" ? v : undefined;
}

async function recordRuntimeAudit(
  sinks: SqliteSinks,
  traceId: string,
  spanId: string,
  fields: { action: string; status: AuditRecord["status"]; output?: unknown },
): Promise<void> {
  const now = new Date().toISOString();
  await sinks.audit().record({
    apiVersion: "company-as-code/v1",
    kind: "AuditRecord",
    id: ulid(),
    actor: { kind: "system", id: "runtime-host" },
    action: fields.action,
    module: "company/runtime",
    startedAt: now,
    completedAt: now,
    durationMs: 0,
    status: fields.status,
    output: fields.output,
    traceId,
    spanId,
  });
}

async function emitRuntimeEvent(
  sinks: SqliteSinks,
  traceId: string,
  spanId: string,
  fields: { type: string; entityId: string; entityKind: string; payload?: Record<string, unknown> },
): Promise<void> {
  const now = new Date().toISOString();
  const event: TypedEvent = {
    apiVersion: "company-as-code/v1",
    kind: "Event",
    id: ulid(),
    type: fields.type,
    entity: { canonicalId: fields.entityId, kind: fields.entityKind },
    occurredAt: now,
    recordedAt: now,
    actor: { kind: "system", id: "runtime-host" },
    payload: fields.payload,
    source: { module: "company/runtime" },
    traceId,
    spanId,
  };
  await sinks.events().emit(event);
}

main()
  .then(() => shutdownTracing())
  .catch(async (err) => {
    await shutdownTracing();
    console.error(err);
    process.exit(2);
  });
