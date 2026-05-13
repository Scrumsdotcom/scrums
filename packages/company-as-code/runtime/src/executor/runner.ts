import { ulid } from "ulid";
import type { AuditSink, EventSink } from "../sinks/types.js";
import type { RepoIndex } from "../loader/repo.js";
import type {
  AuditRecord,
  ExecutionContext,
  StepResult,
  TypedEvent,
  WorkflowDoc,
  WorkflowStep,
} from "../types.js";

export interface ApprovalProvider {
  /**
   * Block until the operator either approves or rejects the step. The
   * provider is responsible for surfacing the dry-run audit output and
   * capturing the approver's canonical Person ID.
   *
   * Returns true on approval, false on rejection.
   */
  prompt(args: {
    correlationId: string;
    workflow: string;
    step: WorkflowStep;
    audit: AuditSink;
    triggerActor: string;
  }): Promise<{ approved: boolean; approver: string; reason?: string }>;
}

export interface AgentInvoker {
  /**
   * Invoke an agent (read-only in this reference implementation — agents
   * conceptually reason / observe / propose). The invoker returns a small
   * structured output that becomes the audit record's `output`.
   */
  invoke(args: {
    agent: string;
    correlationId: string;
    dryRun: boolean;
    repo: RepoIndex;
  }): Promise<{ output: unknown; emittedEvent?: TypedEvent }>;
}

export interface AutomationInvoker {
  /**
   * Invoke an automation. The reference implementation never actually
   * calls external systems — it returns a typed payload describing what
   * *would* be written. `dryRun=true` invocations write the projected
   * payload to the audit log and stop; `dryRun=false` invocations also
   * persist the typed-event emission described by the workflow step.
   */
  invoke(args: {
    automation: string;
    correlationId: string;
    dryRun: boolean;
    inputs: Record<string, unknown>;
    repo: RepoIndex;
  }): Promise<{ projection: unknown; emittedEvent?: TypedEvent }>;
}

export interface ExecutorDeps {
  audit: AuditSink;
  events: EventSink;
  approval: ApprovalProvider;
  agents: AgentInvoker;
  automations: AutomationInvoker;
  repo: RepoIndex;
  /** Override the clock for deterministic tests. */
  now?: () => Date;
}

export class WorkflowExecutor {
  constructor(private readonly deps: ExecutorDeps) {}

  /**
   * Execute a workflow end-to-end. Returns the per-step results in order,
   * including any blocked or skipped steps. Throws when load-time
   * invariants are violated (these surface as refusals rather than
   * silent skips).
   */
  async run(args: {
    workflow: WorkflowDoc;
    inputs?: Record<string, unknown>;
    triggerActor: string;
    /** Override the runtime's mode. When true, all writes are dry-run regardless of step kind. */
    dryRunOnly?: boolean;
  }): Promise<{ ctx: ExecutionContext; results: StepResult[] }> {
    const { workflow } = args;

    // Load-time invariant: hitl workflow + scheduled trigger is refused.
    if (workflow.hitl === true && workflow.trigger.kind === "schedule") {
      throw new Error(
        `${workflow.module}::${workflow.name}: workflow declares hitl: true with trigger.kind=schedule. Refusing to execute.`,
      );
    }

    const now = this.deps.now ?? (() => new Date());
    const correlationId = `${workflow.name}-${ulid().toLowerCase()}`;
    const ctx: ExecutionContext = {
      correlationId,
      workflowName: workflow.name,
      modulePath: workflow.module,
      startedAt: now().toISOString(),
      triggerActor: args.triggerActor,
      dryRun: !!args.dryRunOnly,
      inputs: args.inputs ?? {},
    };

    await this.recordAudit({
      action: "workflow.started",
      actor: { kind: "person", id: args.triggerActor },
      workflow: workflow.name,
      module: workflow.module,
      ctx,
      input: { inputs: ctx.inputs, dryRunOnly: ctx.dryRun },
      status: "success",
    });

    const results: StepResult[] = [];
    const branches = new Map<string, string>(); // step id -> next step id (from branch steps)

    let i = 0;
    while (i < workflow.steps.length) {
      const step = workflow.steps[i];
      const next = branches.get(step.id);
      if (next) {
        // The branch step decided to jump elsewhere.
        const targetIdx = workflow.steps.findIndex((s) => s.id === next);
        if (targetIdx === -1) {
          results.push({ stepId: step.id, status: "failure", message: `branch target '${next}' not found` });
          break;
        }
        i = targetIdx;
        continue;
      }
      const result = await this.runStep(workflow, step, ctx);
      results.push(result);
      if (result.status === "failure" || result.status === "blocked") {
        await this.recordAudit({
          action: "workflow.halted",
          actor: { kind: "system", id: "runtime-host" },
          workflow: workflow.name,
          module: workflow.module,
          ctx,
          status: "failure",
          output: { atStep: step.id, reason: result.message ?? result.status },
        });
        return { ctx, results };
      }
      // Branch decisions stash the next jump for the next loop iteration.
      if (step.kind === "branch" && result.output && typeof result.output === "object") {
        const nextId = (result.output as any).next as string | undefined;
        if (nextId) branches.set(step.id, nextId);
      }
      i += 1;
    }

    await this.recordAudit({
      action: "workflow.completed",
      actor: { kind: "system", id: "runtime-host" },
      workflow: workflow.name,
      module: workflow.module,
      ctx,
      status: "success",
      output: { steps: results.length },
    });
    return { ctx, results };
  }

  private async runStep(
    workflow: WorkflowDoc,
    step: WorkflowStep,
    ctx: ExecutionContext,
  ): Promise<StepResult> {
    const baseAudit = {
      action: `step.${step.kind}`,
      actor: { kind: "system" as const, id: "runtime-host" },
      workflow: workflow.name,
      module: workflow.module,
      ctx,
    };

    switch (step.kind) {
      case "agent": {
        if (!step.agent) {
          return await this.fail(baseAudit, step, "agent step missing 'agent' field");
        }
        const { output, emittedEvent } = await this.deps.agents.invoke({
          agent: step.agent,
          correlationId: ctx.correlationId,
          dryRun: ctx.dryRun,
          repo: this.deps.repo,
        });
        await this.recordAudit({ ...baseAudit, status: "success", output, agent: step.agent });
        if (emittedEvent) await this.emitEvent(emittedEvent, ctx);
        return { stepId: step.id, status: "success", output };
      }

      case "automation":
      case "dry-run":
      case "live-write": {
        if (!step.automation) {
          return await this.fail(baseAudit, step, `${step.kind} step missing 'automation' field`);
        }
        const isLive = step.kind === "live-write" && !ctx.dryRun;

        // Safety rail: a live-write must be preceded by a dry-run audit
        // record under the same correlation ID.
        if (isLive) {
          const prior = await this.deps.audit.byCorrelation(ctx.correlationId);
          const hasDryRun = prior.some((r) => r.dryRun === true && r.targetSystem === step.automation);
          if (!hasDryRun) {
            return await this.fail(
              baseAudit,
              step,
              `live-write '${step.automation}' refuses without a prior dry-run audit record under correlation ${ctx.correlationId}.`,
            );
          }
        }

        const { projection, emittedEvent } = await this.deps.automations.invoke({
          automation: step.automation,
          correlationId: ctx.correlationId,
          dryRun: !isLive,
          inputs: ctx.inputs,
          repo: this.deps.repo,
        });

        await this.recordAudit({
          ...baseAudit,
          status: isLive ? "success" : "dry-run",
          dryRun: !isLive,
          output: projection,
          targetSystem: step.automation,
        });

        if (isLive && (emittedEvent || step.emitsEvent)) {
          const event = emittedEvent ?? this.synthesizeEvent(step.emitsEvent!, workflow, step, ctx);
          await this.emitEvent(event, ctx);
        }
        return { stepId: step.id, status: "success", output: projection };
      }

      case "human-approval": {
        if (!step.approver) {
          return await this.fail(baseAudit, step, "human-approval step missing 'approver' field");
        }
        const decision = await this.deps.approval.prompt({
          correlationId: ctx.correlationId,
          workflow: workflow.name,
          step,
          audit: this.deps.audit,
          triggerActor: ctx.triggerActor,
        });
        await this.recordAudit({
          ...baseAudit,
          actor: { kind: "person", id: decision.approver },
          action: "human-approval",
          status: decision.approved ? "success" : "failure",
          output: { approved: decision.approved, reason: decision.reason },
        });
        if (!decision.approved) {
          return { stepId: step.id, status: "blocked", message: decision.reason ?? "approval rejected" };
        }
        return { stepId: step.id, status: "success" };
      }

      case "emit-event": {
        if (!step.emitsEvent) {
          return await this.fail(baseAudit, step, "emit-event step missing 'emitsEvent' field");
        }
        // Validate the event type is registered, when a registry has been loaded.
        if (this.deps.repo.eventTypes.size > 0 && !this.deps.repo.eventTypes.has(step.emitsEvent)) {
          return await this.fail(
            baseAudit,
            step,
            `event type '${step.emitsEvent}' is not in the EventTypeRegistry.`,
          );
        }
        const event = this.synthesizeEvent(step.emitsEvent, workflow, step, ctx);
        await this.emitEvent(event, ctx);
        await this.recordAudit({ ...baseAudit, status: "success", output: { emitted: step.emitsEvent } });
        return { stepId: step.id, status: "success", emittedEvent: step.emitsEvent };
      }

      case "wait": {
        await this.recordAudit({ ...baseAudit, status: "success", output: { kind: "wait" } });
        return { stepId: step.id, status: "success" };
      }

      case "branch": {
        // The reference implementation does not evaluate `when:` expressions —
        // forks plug in their own predicate evaluator. We always take the
        // first branch.
        const next = step.branches?.[0]?.next;
        await this.recordAudit({ ...baseAudit, status: "success", output: { branchedTo: next } });
        return { stepId: step.id, status: "success", output: { next } };
      }

      case "external-call": {
        // Reference implementation does not perform external calls; this
        // step is recorded as `skipped` so forks can replace with a real
        // call. Audit captures the intent.
        await this.recordAudit({
          ...baseAudit,
          status: "skipped",
          output: { reason: "external-call not implemented in reference runtime" },
        });
        return { stepId: step.id, status: "skipped", message: "external-call not implemented in reference runtime" };
      }

      default: {
        return await this.fail(baseAudit, step, `unknown step kind: ${(step as any).kind}`);
      }
    }
  }

  private synthesizeEvent(
    type: string,
    workflow: WorkflowDoc,
    step: WorkflowStep,
    ctx: ExecutionContext,
  ): TypedEvent {
    const now = this.deps.now ?? (() => new Date());
    return {
      apiVersion: "company-as-code/v1",
      kind: "Event",
      id: ulid(),
      type,
      entity: { canonicalId: ctx.correlationId, kind: "workflow-execution" },
      occurredAt: now().toISOString(),
      recordedAt: now().toISOString(),
      actor: { kind: "system", id: "runtime-host" },
      correlationId: ctx.correlationId,
      source: { module: workflow.module, workflow: workflow.name },
    };
  }

  private async emitEvent(event: TypedEvent, ctx: ExecutionContext): Promise<void> {
    if (!event.correlationId) event.correlationId = ctx.correlationId;
    await this.deps.events.emit(event);
  }

  private async recordAudit(args: {
    action: string;
    actor: AuditRecord["actor"];
    workflow?: string;
    module?: string;
    agent?: string;
    ctx: ExecutionContext;
    input?: unknown;
    output?: unknown;
    status: AuditRecord["status"];
    dryRun?: boolean;
    targetSystem?: string;
    error?: AuditRecord["error"];
  }): Promise<void> {
    const now = this.deps.now ?? (() => new Date());
    const startedAt = now().toISOString();
    const row: AuditRecord = {
      apiVersion: "company-as-code/v1",
      kind: "AuditRecord",
      id: ulid(),
      actor: args.actor,
      action: args.action,
      module: args.module,
      workflow: args.workflow,
      agent: args.agent,
      startedAt,
      completedAt: startedAt,
      durationMs: 0,
      status: args.status,
      dryRun: args.dryRun ?? false,
      input: args.input,
      output: args.output,
      error: args.error,
      correlationId: args.ctx.correlationId,
      targetSystem: args.targetSystem,
    };
    await this.deps.audit.record(row);
  }

  private async fail(
    base: { workflow: string; module: string; ctx: ExecutionContext },
    step: WorkflowStep,
    message: string,
  ): Promise<StepResult> {
    await this.recordAudit({
      action: `step.${step.kind}`,
      actor: { kind: "system", id: "runtime-host" },
      workflow: base.workflow,
      module: base.module,
      ctx: base.ctx,
      status: "failure",
      output: { reason: message },
      error: { message },
    });
    return { stepId: step.id, status: "failure", message };
  }
}
