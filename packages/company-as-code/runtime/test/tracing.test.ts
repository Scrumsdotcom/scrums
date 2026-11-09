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
import { activeTraceContext, initTracing, runInSpan } from "../src/observability/tracing.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");

let sinks: SqliteSinks | undefined;
afterEach(() => {
  sinks?.close();
  sinks = undefined;
});

const HEX_TRACE = /^[0-9a-f]{32}$/;
const HEX_SPAN = /^[0-9a-f]{16}$/;

describe("OpenTelemetry tracing", () => {
  it("issues a real W3C trace context inside a span", async () => {
    initTracing();
    const { tc, inner } = await runInSpan("test-span", { "cac.test": true }, async (tc) => {
      return { tc, inner: activeTraceContext() };
    });
    expect(tc.traceId).toMatch(HEX_TRACE);
    expect(tc.spanId).toMatch(HEX_SPAN);
    expect(inner?.traceId).toBe(tc.traceId);
  });

  it("stamps the same trace ID onto every audit row and typed event of an execution", async () => {
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
    const wf = repo.workflowsByName("month-end-close")[0];
    const { ctx } = await executor.run({
      workflow: wf,
      inputs: { period: "2026-04" },
      triggerActor: "people:finance-lead",
      dryRunOnly: false,
    });

    expect(ctx.traceId).toMatch(HEX_TRACE);

    // The audit log and the event ledger both join on the trace ID.
    const auditByTrace = await sinks.audit().byTrace(ctx.traceId);
    const eventsByTrace = await sinks.events().byTrace(ctx.traceId);
    expect(auditByTrace.length).toBeGreaterThan(0);
    expect(eventsByTrace.length).toBeGreaterThan(0);

    // Cross-check against the correlation view: same set of audit rows.
    const auditByCorrelation = await sinks.audit().byCorrelation(ctx.correlationId);
    expect(auditByTrace.length).toBe(auditByCorrelation.length);

    for (const r of auditByTrace) {
      expect(r.traceId).toBe(ctx.traceId);
      // Step rows carry a span ID; the workflow-level rows carry the root span.
      expect(r.spanId).toMatch(HEX_SPAN);
    }
    for (const e of eventsByTrace) {
      expect(e.traceId).toBe(ctx.traceId);
      expect(e.spanId).toMatch(HEX_SPAN);
    }
  });

  it("gives distinct trace IDs to distinct executions", async () => {
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
    const wf = repo.workflowsByName("month-end-close")[0];
    const a = await executor.run({ workflow: wf, inputs: { period: "2026-04" }, triggerActor: "people:x", dryRunOnly: true });
    const b = await executor.run({ workflow: wf, inputs: { period: "2026-05" }, triggerActor: "people:x", dryRunOnly: true });
    expect(a.ctx.traceId).not.toBe(b.ctx.traceId);
  });
});
