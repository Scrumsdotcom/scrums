import type { ApprovalProvider } from "../executor/runner.js";
import type { AuditSink } from "../sinks/types.js";
import type { WorkflowStep } from "../types.js";
import { activeTraceContext } from "../observability/tracing.js";
import { SqliteHitlInbox } from "./inbox.js";

/**
 * Approval provider that routes human-approval steps through the HITL inbox.
 *
 * Unlike the interactive stdin provider, this one does not assume a human is
 * sitting at the same terminal as the workflow. It enqueues the dry-run
 * projection into a durable inbox and blocks, polling until a human resolves
 * the item, from the CLI (`cac-host inbox approve/reject`) or the web
 * dashboard (`cac-host inbox serve`). The workflow process can be headless
 * and long-running; the human shows up whenever they show up.
 */
export class QueuedApprovalProvider implements ApprovalProvider {
  constructor(
    private readonly inbox: SqliteHitlInbox,
    private readonly opts: { pollMs?: number; timeoutMs?: number } = {},
  ) {}

  async prompt(args: {
    correlationId: string;
    workflow: string;
    module: string;
    step: WorkflowStep;
    audit: AuditSink;
    triggerActor: string;
  }): Promise<{ approved: boolean; approver: string; reason?: string }> {
    // The thing a human signs off is the most recent dry-run projection in
    // this correlation. The "what would happen" the spec's dry-run-then-live
    // gate produces.
    const prior = await args.audit.byCorrelation(args.correlationId);
    const lastDryRun = [...prior].reverse().find((r) => r.dryRun === true);
    const tc = activeTraceContext();

    const item = this.inbox.enqueue({
      correlationId: args.correlationId,
      traceId: tc?.traceId,
      workflow: args.workflow,
      module: args.module,
      stepId: args.step.id,
      approverRole: args.step.approver ?? "(unspecified)",
      triggerActor: args.triggerActor,
      projection: lastDryRun?.output,
    });

    console.error(
      `⏸  human approval queued, inbox item ${item.id}\n` +
        `   workflow: ${args.module}::${args.workflow}  step: ${args.step.id}  approver: ${item.approverRole}\n` +
        `   resolve with: cac-host inbox approve ${item.id} --approver <person>\n` +
        `             or: cac-host inbox serve   (web dashboard)`,
    );

    const resolved = await this.inbox.waitFor(item.id, this.opts);
    return {
      approved: resolved.status === "approved",
      approver: resolved.resolvedBy ?? "system:operator",
      reason: resolved.reason,
    };
  }
}
