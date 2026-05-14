import { ulid } from "ulid";
import * as readline from "node:readline/promises";
import type { AuditSink } from "../sinks/types.js";
import type { RepoIndex } from "../loader/repo.js";
import type { AgentInvoker, ApprovalProvider, AutomationInvoker } from "./runner.js";
import type { TypedEvent, WorkflowStep } from "../types.js";

/**
 * Reference invokers. Forks replace these with real implementations that
 * call into their AI runtime / automation framework / approval UI. The
 * shapes here are the contracts.
 */

export class ReferenceAgentInvoker implements AgentInvoker {
  async invoke(args: {
    agent: string;
    correlationId: string;
    dryRun: boolean;
    repo: RepoIndex;
  }): Promise<{ output: unknown; emittedEvent?: TypedEvent }> {
    const decl = args.repo.agents.get(args.agent);
    return {
      output: {
        agent: args.agent,
        autonomy: decl?.autonomy ?? "unknown",
        purpose: decl?.purpose ?? "(undeclared)",
        note: "Reference invoker — agent observed declared inputs; no real AI invocation performed.",
        observed: {
          inputs: decl?.inputs ?? [],
          outputs: decl?.outputs ?? [],
        },
      },
    };
  }
}

export class ReferenceAutomationInvoker implements AutomationInvoker {
  async invoke(args: {
    automation: string;
    correlationId: string;
    dryRun: boolean;
    inputs: Record<string, unknown>;
    repo: RepoIndex;
  }): Promise<{ projection: unknown; emittedEvent?: TypedEvent }> {
    const decl = args.repo.automations.get(args.automation);
    // The reference invoker computes a projection by surfacing the
    // automation's declared `mutates` and `failureModes` along with the
    // current inputs. Forks replace with real client calls.
    const projection = {
      automation: args.automation,
      dryRun: args.dryRun,
      inputs: args.inputs,
      declared: {
        mutates: decl?.mutates ?? [],
        invariants: decl?.invariants ?? [],
        failureModes: decl?.failureModes ?? [],
      },
      note: args.dryRun
        ? "Dry-run: projected payload computed; no external mutation performed."
        : "Live: reference invoker performs no real external call.",
    };
    return { projection };
  }
}

/**
 * Interactive approval — reads from stdin. Used when the runtime host
 * runs in foreground TTY mode. Forks plug in an HTTP-backed provider
 * for an admin surface.
 */
export class InteractiveApprovalProvider implements ApprovalProvider {
  async prompt(args: {
    correlationId: string;
    workflow: string;
    module: string;
    step: WorkflowStep;
    audit: AuditSink;
    triggerActor: string;
  }): Promise<{ approved: boolean; approver: string; reason?: string }> {
    const prior = await args.audit.byCorrelation(args.correlationId);
    const lastDryRun = [...prior].reverse().find((r) => r.dryRun === true);
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
      console.log(`\n── human approval required ──`);
      console.log(`workflow:      ${args.workflow}`);
      console.log(`step:          ${args.step.id}`);
      console.log(`approver role: ${args.step.approver}`);
      console.log(`correlationId: ${args.correlationId}`);
      if (lastDryRun) {
        console.log(`\nlast dry-run audit (${lastDryRun.id}):`);
        console.log(JSON.stringify(lastDryRun.output, null, 2));
      } else {
        console.log("\n(no dry-run audit found in this correlation)");
      }
      const decision = (await rl.question("\napprove? (y/N) ")).trim().toLowerCase();
      const approver =
        (await rl.question("approver canonical Person ID (or blank for system:operator): ")).trim() ||
        "system:operator";
      const reason = decision === "y" ? undefined : (await rl.question("rejection reason (optional): ")).trim() || undefined;
      return { approved: decision === "y", approver, reason };
    } finally {
      rl.close();
    }
  }
}

/**
 * Auto-approve provider — used in tests and headless CI runs where the
 * point is to exercise the full executor pathway, not gate on a human.
 */
export class AutoApprovalProvider implements ApprovalProvider {
  constructor(private readonly approver: string = "test:auto-approver") {}
  async prompt(): Promise<{ approved: boolean; approver: string }> {
    return { approved: true, approver: this.approver };
  }
}

/** Suppress unused-import warning for ulid in this module's TS check. */
void ulid;
