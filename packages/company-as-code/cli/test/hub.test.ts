import { describe, expect, it } from "vitest";
import {
  loadHubModules,
  hubIndex,
  validateHub,
  hubAddCommand,
  hubShowCommand,
} from "../src/hub.js";

describe("CaC-Hub registry", () => {
  it("loads every hub module with its payload inventory", async () => {
    const modules = await loadHubModules();
    expect(modules.length).toBeGreaterThanOrEqual(2);
    const names = modules.map((m) => m.data.name).sort();
    expect(names).toContain("standard-hr");
    expect(names).toContain("subscription-billing");
    for (const m of modules) {
      expect(m.data.kind).toBe("HubModule");
      expect(m.payloadFiles.length).toBeGreaterThan(0);
    }
  });

  it("validates every hub module and its payload against the framework schemas", async () => {
    const problems = await validateHub();
    if (problems.length > 0) {
      console.error(JSON.stringify(problems, null, 2));
    }
    expect(problems).toEqual([]);
  });

  it("scaffolds[] and the payload/ directory agree exactly", async () => {
    const modules = await loadHubModules();
    for (const m of modules) {
      const declared = (m.data.scaffolds ?? []).map((s: any) => s.path).sort();
      expect(m.payloadFiles.slice().sort()).toEqual(declared);
    }
  });

  it("hubIndex is deterministic and lists every module", async () => {
    const modules = await loadHubModules();
    const a = hubIndex(modules);
    const b = hubIndex(modules);
    expect(a.content).toEqual(b.content);
    expect(a.name).toBe("hub-index.json");
    const parsed = JSON.parse(a.content);
    expect(parsed.count).toBe(modules.length);
    expect(parsed.modules.map((m: any) => m.name)).toContain("standard-hr");
  });

  it("hub add defaults to a dry-run that writes nothing", async () => {
    const ok = await hubAddCommand("standard-hr", { write: false });
    expect(ok).toBe(true);
    // Dry-run must not have created the destination.
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const { REPO_ROOT } = await import("../src/paths.js");
    const dest = path.join(REPO_ROOT, "company/domains/finance-ops/people-ops");
    await expect(fs.stat(dest)).rejects.toThrow();
  });

  it("hub add refuses an unknown module", async () => {
    const ok = await hubAddCommand("does-not-exist", { write: false });
    expect(ok).toBe(false);
  });

  it("hub show returns false for an unknown module", async () => {
    expect(await hubShowCommand("nope")).toBe(false);
  });
});
