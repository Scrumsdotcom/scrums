import { describe, expect, it, afterEach } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SqliteSinks } from "../src/sinks/sqlite.js";
import { WorkflowExecutor } from "../src/executor/runner.js";
import {
  AutoApprovalProvider,
  ReferenceAgentInvoker,
  ReferenceAutomationInvoker,
} from "../src/executor/reference-invokers.js";
import { loadRepo } from "../src/loader/repo.js";
import type { WorkflowDoc } from "../src/types.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");

let sinks: SqliteSinks | undefined;
afterEach(() => {
  sinks?.close();
  sinks = undefined;
});

async function newExecutor() {
  sinks = new SqliteSinks(":memory:");
  const repo = await loadRepo(repoRoot);
  return {
    repo,
    executor: new WorkflowExecutor({
      audit: sinks.audit(),
      events: sinks.events(),
      approval: new AutoApprovalProvider(),
      agents: new ReferenceAgentInvoker(),
      automations: new ReferenceAutomationInvoker(),
      repo,
    }),
  };
}

describe("WorkflowExecutor", () => {
  it("runs the month-end-close workflow end-to-end in dry-run mode", async () => {
    const { repo, executor } = await newExecutor();
    const wf = repo.workflowsByName("month-end-close")[0];
    expect(wf).toBeDefined();
    const { ctx, results } = await executor.run({
      workflow: wf,
      inputs: { period: "2026-04" },
      triggerActor: "people:finance-lead",
      dryRunOnly: true,
    });
    expect(ctx.dryRun).toBe(true);
    expect(results.every((r) => r.status === "success")).toBe(true);
    const audit = await sinks!.audit().byCorrelation(ctx.correlationId);
    expect(audit.length).toBeGreaterThan(0);
    expect(audit.some((r) => r.action === "workflow.started")).toBe(true);
    expect(audit.some((r) => r.action === "workflow.completed")).toBe(true);
    expect(audit.some((r) => r.dryRun === true)).toBe(true);
  });

  it("emits typed events when running live", async () => {
    const { repo, executor } = await newExecutor();
    const wf = repo.workflowsByName("month-end-close")[0];
    const { ctx } = await executor.run({
      workflow: wf,
      inputs: { period: "2026-04" },
      triggerActor: "people:finance-lead",
      dryRunOnly: false,
    });
    const events = await sinks!.events().byType("finance.period_closed");
    expect(events.some((e) => e.correlationId === ctx.correlationId)).toBe(true);
  });

  it("refuses to advance past a live-write without a prior dry-run in the same correlation", async () => {
    sinks = new SqliteSinks(":memory:");
    const repo = await loadRepo(repoRoot);
    const executor = new WorkflowExecutor({
      audit: sinks.audit(),
      events: sinks.events(),
      approval: new AutoApprovalProvider(),
      agents: new ReferenceAgentInvoker(),
      automations: new ReferenceAutomationInvoker(),
      repo,
    });

    // Synthetic workflow with a live-write that is NOT preceded by a dry-run step.
    const wf: WorkflowDoc = {
      apiVersion: "company-as-code/v1alpha1",
      kind: "Workflow",
      name: "synthetic-no-dryrun",
      module: "company/test",
      purpose: "Test that live-write refuses without prior dry-run audit row.",
      trigger: { kind: "human", actor: "people:test" },
      hitl: true,
      steps: [
        { id: "approve", kind: "human-approval", approver: "people:test", hitl: true },
        { id: "boom", kind: "live-write", automation: "post-period-close", onFailure: "abort", retries: 0 },
      ],
    };
    const { results } = await executor.run({
      workflow: wf,
      triggerActor: "people:test",
      dryRunOnly: false, // attempting a live run...
    });
    const boom = results.find((r) => r.stepId === "boom");
    expect(boom).toBeDefined();
    expect(boom!.status).toBe("failure");
    expect(boom!.message).toMatch(/refuses without a prior dry-run/);
  });

  it("refuses to load a hitl workflow with a scheduled trigger", async () => {
    const { repo: _repo, executor } = await newExecutor();
    const wf: WorkflowDoc = {
      apiVersion: "company-as-code/v1alpha1",
      kind: "Workflow",
      name: "bad",
      module: "company/test",
      purpose: "Has hitl: true with a scheduled trigger.",
      trigger: { kind: "schedule", schedule: "0 9 * * MON" },
      hitl: true,
      steps: [{ id: "approve", kind: "human-approval", approver: "people:test", hitl: true }],
    };
    await expect(
      executor.run({ workflow: wf, triggerActor: "people:test", dryRunOnly: true }),
    ).rejects.toThrow(/Refusing to execute/);
  });

  it("branch steps actually jump: the skipped step does NOT execute", async () => {
    const { executor } = await newExecutor();
    const wf: WorkflowDoc = {
      apiVersion: "company-as-code/v1alpha1",
      kind: "Workflow",
      name: "branchy",
      module: "company/test",
      purpose: "Branch jumps over the middle step.",
      trigger: { kind: "human", actor: "people:test" },
      steps: [
        // Reference implementation always takes the first branch.
        { id: "decide", kind: "branch", branches: [{ when: "always", next: "landing" }] },
        { id: "must-be-skipped", kind: "wait" },
        { id: "landing", kind: "wait" },
      ],
    };
    const { ctx, results } = await executor.run({
      workflow: wf,
      triggerActor: "people:test",
      dryRunOnly: true,
    });
    const executed = results.map((r) => r.stepId);
    expect(executed).toEqual(["decide", "landing"]);
    expect(executed).not.toContain("must-be-skipped");
    // The audit trail must agree with what actually happened.
    const audit = await sinks!.audit().byCorrelation(ctx.correlationId);
    const branchRow = audit.find((r) => r.action === "step.branch");
    expect(branchRow).toBeDefined();
    expect((branchRow!.output as any).branchedTo).toBe("landing");
    expect(audit.some((r) => r.action === "workflow.completed")).toBe(true);
  });

  it("halts with an audited failure when a branch targets an unknown step", async () => {
    const { executor } = await newExecutor();
    const wf: WorkflowDoc = {
      apiVersion: "company-as-code/v1alpha1",
      kind: "Workflow",
      name: "branch-bad-target",
      module: "company/test",
      purpose: "Branch target does not exist.",
      trigger: { kind: "human", actor: "people:test" },
      steps: [
        { id: "decide", kind: "branch", branches: [{ when: "always", next: "nowhere" }] },
        { id: "after", kind: "wait" },
      ],
    };
    const { ctx, results } = await executor.run({
      workflow: wf,
      triggerActor: "people:test",
      dryRunOnly: true,
    });
    const failure = results.find((r) => r.status === "failure");
    expect(failure).toBeDefined();
    expect(failure!.message).toMatch(/branch target 'nowhere' not found/);
    expect(results.map((r) => r.stepId)).not.toContain("after");
    const audit = await sinks!.audit().byCorrelation(ctx.correlationId);
    expect(audit.some((r) => r.action === "workflow.halted")).toBe(true);
    expect(audit.some((r) => r.action === "workflow.completed")).toBe(false);
  });

  it("halts a branch cycle via the max-iterations guard", async () => {
    const { executor } = await newExecutor();
    const wf: WorkflowDoc = {
      apiVersion: "company-as-code/v1alpha1",
      kind: "Workflow",
      name: "branch-cycle",
      module: "company/test",
      purpose: "Branch jumps to itself forever.",
      trigger: { kind: "human", actor: "people:test" },
      steps: [{ id: "loop", kind: "branch", branches: [{ when: "always", next: "loop" }] }],
    };
    const { ctx, results } = await executor.run({
      workflow: wf,
      triggerActor: "people:test",
      dryRunOnly: true,
    });
    expect(results.length).toBeLessThanOrEqual(100);
    const audit = await sinks!.audit().byCorrelation(ctx.correlationId);
    const halted = audit.find((r) => r.action === "workflow.halted");
    expect(halted).toBeDefined();
    expect((halted!.output as any).reason).toMatch(/branch cycle suspected/);
  });

  it("rejects emit-event for a type not in the registry", async () => {
    const { repo: _repo, executor } = await newExecutor();
    const wf: WorkflowDoc = {
      apiVersion: "company-as-code/v1alpha1",
      kind: "Workflow",
      name: "emit-bad",
      module: "company/test",
      purpose: "Emits an event not in the registry.",
      trigger: { kind: "human" },
      steps: [{ id: "go", kind: "emit-event", emitsEvent: "made.up.type" }],
    };
    const { results } = await executor.run({
      workflow: wf,
      triggerActor: "people:test",
      dryRunOnly: true,
    });
    const go = results.find((r) => r.stepId === "go")!;
    expect(go.status).toBe("failure");
    expect(go.message).toMatch(/EventTypeRegistry/);
  });
});
