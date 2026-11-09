import { describe, expect, it, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CognitionLiveReader } from "../src/cognition/live-reader.js";
import { startCognitionServer } from "../src/cognition/server.js";
import { SqliteSinks } from "../src/sinks/sqlite.js";
import { WorkflowExecutor } from "../src/executor/runner.js";
import {
  AutoApprovalProvider,
  ReferenceAgentInvoker,
  ReferenceAutomationInvoker,
} from "../src/executor/reference-invokers.js";
import { loadRepo } from "../src/loader/repo.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");

const tmpDbs: string[] = [];
function tmpDb(): string {
  const p = path.join(os.tmpdir(), `cac-cog-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
  tmpDbs.push(p);
  return p;
}
afterEach(() => {
  for (const p of tmpDbs.splice(0)) {
    for (const suffix of ["", "-wal", "-shm", "-journal"]) {
      try {
        fs.unlinkSync(p + suffix);
      } catch {
        /* ignore */
      }
    }
  }
});

describe("CognitionLiveReader", () => {
  it("returns all-zero totals on a brand-new database (tables may not exist yet)", () => {
    const reader = new CognitionLiveReader(tmpDb());
    try {
      const overlay = reader.overlay();
      expect(overlay.totals.events).toBe(0);
      expect(overlay.totals.auditRows).toBe(0);
      expect(overlay.totals.pendingApprovals).toBe(0);
      expect(overlay.perModule).toEqual({});
      expect(overlay.recentEvents).toEqual([]);
    } finally {
      reader.close();
    }
  });

  it("aggregates audit + event activity per module after a workflow runs", async () => {
    const db = tmpDb();
    const sinks = new SqliteSinks(db);
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
    await executor.run({
      workflow: wf,
      inputs: { period: "2026-04" },
      triggerActor: "people:finance-lead",
      dryRunOnly: false,
    });
    sinks.close();

    const reader = new CognitionLiveReader(db);
    try {
      const overlay = reader.overlay();
      expect(overlay.totals.auditRows).toBeGreaterThan(0);
      expect(overlay.totals.events).toBeGreaterThan(0);
      expect(overlay.totals.traces).toBeGreaterThanOrEqual(1);
      const mod = "company/domains/finance-ops/finance";
      expect(overlay.perModule[mod]).toBeDefined();
      expect(overlay.perModule[mod].auditRows).toBeGreaterThan(0);
      expect(overlay.recentEvents.length).toBeGreaterThan(0);
      expect(overlay.recentTraces.length).toBeGreaterThanOrEqual(1);
    } finally {
      reader.close();
    }
  });
});

describe("Visual Cognition Graph server", () => {
  it("serves the generated structure, the live overlay, and the HTML page", async () => {
    const running = await startCognitionServer({ repoRoot, dbPath: tmpDb(), port: 0 });
    try {
      const graph = await fetch(`${running.url}/api/graph`).then((r) => r.json());
      expect(graph.kind).toBe("CognitionGraph");
      expect(Array.isArray(graph.domains)).toBe(true);
      expect(graph.stats.moduleCount).toBeGreaterThan(0);

      const live = await fetch(`${running.url}/api/live`).then((r) => r.json());
      expect(live.totals).toBeDefined();
      expect(live.perModule).toBeDefined();

      const page = await fetch(`${running.url}/`).then((r) => r.text());
      expect(page).toContain("Visual Cognition Graph");

      const missing = await fetch(`${running.url}/nope`);
      expect(missing.status).toBe(404);
    } finally {
      await running.close();
    }
  });
});
