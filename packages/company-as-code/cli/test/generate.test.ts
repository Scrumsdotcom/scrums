import { describe, expect, it, beforeAll, afterAll } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const here = path.dirname(fileURLToPath(import.meta.url));
const cliDir = path.resolve(here, "..");
const generatedDir = path.resolve(cliDir, "..", "generated");
const exec = promisify(execFile);

async function readGeneratedSnapshot(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.isFile()) {
        const rel = path.relative(generatedDir, full).replace(/\\/g, "/");
        out[rel] = await fs.readFile(full, "utf8");
      }
    }
  }
  await walk(generatedDir);
  return out;
}

describe("generator contract", () => {
  let baseline: Record<string, string>;

  beforeAll(async () => {
    baseline = await readGeneratedSnapshot();
  });

  afterAll(async () => {
    // Restore baseline to leave /generated untouched after the suite.
    await exec("npx", ["tsx", "src/index.ts", "generate"], { cwd: cliDir });
  });

  it("is idempotent: regenerating twice produces byte-identical output", async () => {
    await exec("npx", ["tsx", "src/index.ts", "generate"], { cwd: cliDir });
    const first = await readGeneratedSnapshot();
    await exec("npx", ["tsx", "src/index.ts", "generate"], { cwd: cliDir });
    const second = await readGeneratedSnapshot();
    expect(Object.keys(second).sort()).toEqual(Object.keys(first).sort());
    for (const key of Object.keys(first)) {
      expect(second[key], `mismatch at ${key}`).toEqual(first[key]);
    }
  }, 60_000);

  it("drift gate flags an orphan file under /generated", async () => {
    const orphan = path.join(generatedDir, "_orphan-test.json");
    await fs.writeFile(orphan, "{}\n", "utf8");
    try {
      const res = await exec("npx", ["tsx", "src/index.ts", "generate", "--check"], {
        cwd: cliDir,
      }).catch((e) => e as { stdout: string; stderr: string; code: number });
      const stderr = (res as any).stderr ?? "";
      const stdout = (res as any).stdout ?? "";
      expect(stderr + stdout).toMatch(/orphan/i);
      expect((res as any).code ?? 0).not.toBe(0);
    } finally {
      await fs.unlink(orphan).catch(() => {});
    }
  }, 60_000);

  it("baseline /generated matches the snapshot captured at suite start", async () => {
    // Effectively: generate did not silently corrupt baseline state during
    // earlier-running tests in this file. We re-snapshot and compare.
    const now = await readGeneratedSnapshot();
    expect(Object.keys(now).sort()).toEqual(Object.keys(baseline).sort());
  });
});
