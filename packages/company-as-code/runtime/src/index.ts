#!/usr/bin/env node
import path from "node:path";
import { loadRepo } from "./loader/repo.js";
import { SqliteSinks } from "./sinks/sqlite.js";
import { WorkflowExecutor } from "./executor/runner.js";
import {
  AutoApprovalProvider,
  InteractiveApprovalProvider,
  ReferenceAgentInvoker,
  ReferenceAutomationInvoker,
} from "./executor/reference-invokers.js";

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

Options for 'execute':
  --module <path>           Owning module path. Required when workflow name is ambiguous.
  --input <name>=<value>    Add a workflow input. May repeat.
  --trigger-actor <id>      Canonical Person ID. Defaults to system:operator.
  --live                    Allow live-writes. Default is dry-run-only.
  --auto-approve            Bypass interactive approval (tests / CI).

Global options:
  --repo <path>             Repository root. Defaults to cwd.
  --db <path>               SQLite file. Defaults to ./runtime.db.

Environment:
  RUNTIME_DB                Overrides --db.
  RUNTIME_REPO              Overrides --repo.

Exit codes:
  0  success
  1  command-line / load-time error
  2  workflow halted at a step
`,
  );
}

async function main(): Promise<void> {
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
      const executor = new WorkflowExecutor({
        audit: sinks.audit(),
        events: sinks.events(),
        approval: autoApprove ? new AutoApprovalProvider() : new InteractiveApprovalProvider(),
        agents: new ReferenceAgentInvoker(),
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
          console.log(`  - ${r.stepId}: ${r.status}${r.message ? ` — ${r.message}` : ""}`);
        }
        const halted = results.some((r) => r.status === "failure" || r.status === "blocked");
        if (halted) process.exit(2);
      } catch (err) {
        console.error(`execute: ${(err as Error).message}`);
        process.exit(1);
      } finally {
        sinks.close();
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

    default: {
      console.error(`unknown command: ${args.command}`);
      help();
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
