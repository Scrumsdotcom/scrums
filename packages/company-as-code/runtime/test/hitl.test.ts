import { describe, expect, it, afterEach } from "vitest";
import { SqliteHitlInbox } from "../src/hitl/inbox.js";
import { QueuedApprovalProvider } from "../src/hitl/queued-approval.js";
import { startInboxServer } from "../src/hitl/server.js";
import { SqliteSinks } from "../src/sinks/sqlite.js";
import { WorkflowExecutor } from "../src/executor/runner.js";
import {
  ReferenceAgentInvoker,
  ReferenceAutomationInvoker,
} from "../src/executor/reference-invokers.js";
import { loadRepo } from "../src/loader/repo.js";
import type { WorkflowDoc } from "../src/types.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");

let inbox: SqliteHitlInbox | undefined;
let sinks: SqliteSinks | undefined;
afterEach(() => {
  inbox?.close();
  sinks?.close();
  inbox = undefined;
  sinks = undefined;
});

const ENQUEUE = {
  correlationId: "wf-abc",
  workflow: "month-end-close",
  module: "company/domains/finance-ops/finance",
  stepId: "approve",
  approverRole: "people:finance-lead",
  triggerActor: "people:ops",
  projection: { wouldPost: 3, ledger: "GL" },
};

describe("SqliteHitlInbox", () => {
  it("enqueues, lists and resolves a pending approval", () => {
    inbox = new SqliteHitlInbox(":memory:");
    const item = inbox.enqueue(ENQUEUE);
    expect(item.status).toBe("pending");
    expect(inbox.list("pending")).toHaveLength(1);

    const resolved = inbox.resolve(item.id, { approved: true, approver: "people:cfo" });
    expect(resolved.status).toBe("approved");
    expect(resolved.resolvedBy).toBe("people:cfo");
    expect(inbox.list("pending")).toHaveLength(0);
    expect(inbox.list("approved")).toHaveLength(1);
  });

  it("refuses to re-resolve an already-resolved item", () => {
    inbox = new SqliteHitlInbox(":memory:");
    const item = inbox.enqueue(ENQUEUE);
    inbox.resolve(item.id, { approved: true, approver: "people:cfo" });
    expect(() =>
      inbox!.resolve(item.id, { approved: false, approver: "people:other", reason: "no" }),
    ).toThrow(/already approved/);
  });

  it("waitFor unblocks when the item is resolved out-of-band", async () => {
    inbox = new SqliteHitlInbox(":memory:");
    const item = inbox.enqueue(ENQUEUE);
    const waiter = inbox.waitFor(item.id, { pollMs: 10 });
    setTimeout(() => inbox!.resolve(item.id, { approved: true, approver: "people:cfo" }), 30);
    const resolved = await waiter;
    expect(resolved.status).toBe("approved");
  });

  it("waitFor times out if nobody resolves the item", async () => {
    inbox = new SqliteHitlInbox(":memory:");
    const item = inbox.enqueue(ENQUEUE);
    await expect(inbox.waitFor(item.id, { pollMs: 10, timeoutMs: 40 })).rejects.toThrow(
      /timed out/,
    );
  });
});

describe("QueuedApprovalProvider, workflow integration", () => {
  function syntheticHitlWorkflow(): WorkflowDoc {
    return {
      apiVersion: "company-as-code/v1alpha1",
      kind: "Workflow",
      name: "synthetic-hitl",
      module: "company/test",
      purpose: "human-approval step routed through the HITL inbox.",
      trigger: { kind: "human", actor: "people:test" },
      hitl: true,
      steps: [{ id: "approve", kind: "human-approval", approver: "people:finance-lead", hitl: true }],
    };
  }

  it("a workflow blocks on the inbox and proceeds once a human approves", async () => {
    sinks = new SqliteSinks(":memory:");
    // Inbox shares the in-memory DB? No, :memory: is per-connection. Use a
    // shared inbox instance for both the provider and the resolver.
    inbox = new SqliteHitlInbox(":memory:");
    const repo = await loadRepo(repoRoot);
    const executor = new WorkflowExecutor({
      audit: sinks.audit(),
      events: sinks.events(),
      approval: new QueuedApprovalProvider(inbox, { pollMs: 15 }),
      agents: new ReferenceAgentInvoker(),
      automations: new ReferenceAutomationInvoker(),
      repo,
    });

    const run = executor.run({
      workflow: syntheticHitlWorkflow(),
      triggerActor: "people:test",
      dryRunOnly: true,
    });

    // A "human" shows up: poll for the queued item, then approve it.
    await pollUntil(() => inbox!.list("pending").length === 1, 1000);
    const pending = inbox.list("pending")[0];
    expect(pending.workflow).toBe("synthetic-hitl");
    expect(pending.approverRole).toBe("people:finance-lead");
    inbox.resolve(pending.id, { approved: true, approver: "people:cfo" });

    const { results } = await run;
    expect(results.find((r) => r.stepId === "approve")?.status).toBe("success");
  });

  it("a rejected inbox item blocks the workflow", async () => {
    sinks = new SqliteSinks(":memory:");
    inbox = new SqliteHitlInbox(":memory:");
    const repo = await loadRepo(repoRoot);
    const executor = new WorkflowExecutor({
      audit: sinks.audit(),
      events: sinks.events(),
      approval: new QueuedApprovalProvider(inbox, { pollMs: 15 }),
      agents: new ReferenceAgentInvoker(),
      automations: new ReferenceAutomationInvoker(),
      repo,
    });

    const run = executor.run({
      workflow: syntheticHitlWorkflow(),
      triggerActor: "people:test",
      dryRunOnly: true,
    });

    await pollUntil(() => inbox!.list("pending").length === 1, 1000);
    const pending = inbox.list("pending")[0];
    inbox.resolve(pending.id, { approved: false, approver: "people:cfo", reason: "numbers look off" });

    const { results } = await run;
    const step = results.find((r) => r.stepId === "approve")!;
    expect(step.status).toBe("blocked");
    expect(step.message).toMatch(/numbers look off/);
  });
});

describe("HITL dashboard server", () => {
  it("serves the inbox over a JSON API and resolves items via POST", async () => {
    inbox = new SqliteHitlInbox(":memory:");
    const item = inbox.enqueue(ENQUEUE);
    const running = await startInboxServer({ inbox, port: 0 });
    try {
      const list = await fetch(`${running.url}/api/items`).then((r) => r.json());
      expect(list.items).toHaveLength(1);
      expect(list.items[0].id).toBe(item.id);

      const page = await fetch(`${running.url}/`).then((r) => r.text());
      expect(page).toContain("HITL Inbox");

      const res = await fetch(`${running.url}/api/resolve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: item.id, approved: true, approver: "people:cfo" }),
      });
      expect(res.status).toBe(200);
      expect(inbox.get(item.id)?.status).toBe("approved");

      // Re-resolving the same item is a 409 conflict, not a silent overwrite.
      const conflict = await fetch(`${running.url}/api/resolve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: item.id, approved: false, approver: "people:x", reason: "no" }),
      });
      expect(conflict.status).toBe(409);
    } finally {
      await running.close();
    }
  });
});

async function pollUntil(cond: () => boolean, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (!cond()) {
    if (Date.now() - start > timeoutMs) throw new Error("pollUntil timed out");
    await new Promise((r) => setTimeout(r, 10));
  }
}
