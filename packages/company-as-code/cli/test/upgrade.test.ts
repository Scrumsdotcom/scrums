import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  LOCK_FILE,
  checkBoundary,
  computeLock,
  failing,
  instanceYaml,
  loadLock,
  serializeLock,
  type InstanceConfig,
} from "../src/boundary.js";
import { compareVersions, planUpgrade, unsafeLockPaths, upgradeCommand } from "../src/upgrade.js";
import { apiVersionOf, chain, planMigration } from "../src/migrate.js";
import type { Migration } from "../src/migrations/index.js";
import { API_VERSION } from "../src/version.js";

const upstream: InstanceConfig = {
  apiVersion: API_VERSION,
  kind: "Instance",
  name: "Upstream",
  role: "upstream",
  namespace: "cac",
  framework: { version: "1.0.0" },
};

async function write(root: string, rel: string, content: string) {
  const full = path.join(root, rel);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, "utf8");
}

async function publish(root: string, version: string) {
  await write(root, "package.json", JSON.stringify({ version }));
  await write(root, "cac.yaml", instanceYaml({ ...upstream, framework: { version } }));
  await write(root, LOCK_FILE, serializeLock(await computeLock(root, upstream)));
}

describe("cac upgrade", () => {
  let tmp: string;
  let up: string;
  let fork: string;

  beforeEach(async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), "cac-upgrade-"));
    up = path.join(tmp, "upstream");
    fork = path.join(tmp, "fork");

    // Release 1.0.0
    await write(up, "schemas/a.schema.json", "a1\n");
    await write(up, "schemas/b.schema.json", "b1\n");
    await write(up, "docs/old.md", "old\n");
    await write(up, "README.md", "readme 1\n");
    await write(up, "company/x.yaml", "upstream example\n");
    await publish(up, "1.0.0");

    // The fork takes 1.0.0, declares itself, and changes one framework file.
    await fs.cp(up, fork, { recursive: true });
    await write(
      fork,
      "cac.yaml",
      "# Acme's instance file. This comment must survive the upgrade.\n" +
        instanceYaml({ ...upstream, name: "Acme", role: "fork", namespace: "acme" }),
    );
    await write(fork, "schemas/b.schema.json", "b-acme\n");
    await write(fork, "company/x.yaml", "acme's own company\n");

    // Release 1.1.0
    await write(up, "schemas/a.schema.json", "a2\n");
    await write(up, "schemas/b.schema.json", "b2\n");
    await write(up, "schemas/c.schema.json", "c2\n");
    await fs.rm(path.join(up, "docs/old.md"));
    await write(up, "README.md", "readme 2\n");
    await write(up, "company/x.yaml", "upstream example, revised\n");
    await publish(up, "1.1.0");
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it("plans one action per framework file from the three hashes", async () => {
    const plan = await planUpgrade(fork, (await loadLock(fork))!, (await loadLock(up))!);
    const byPath = Object.fromEntries(plan.actions.map((a) => [a.path, a.kind]));
    expect(plan.from).toBe("1.0.0");
    expect(plan.to).toBe("1.1.0");
    expect(byPath["schemas/a.schema.json"]).toBe("update");
    expect(byPath["schemas/b.schema.json"]).toBe("conflict");
    expect(byPath["schemas/c.schema.json"]).toBe("add");
    expect(byPath["docs/old.md"]).toBe("remove");
    expect(byPath["README.md"]).toBe("review-adapt");
    expect(byPath["company/x.yaml"]).toBeUndefined();
  });

  it("is a dry run by default and writes nothing", async () => {
    await upgradeCommand({ from: up, write: false, allowConflicts: false }, fork);
    expect(await fs.readFile(path.join(fork, "schemas/a.schema.json"), "utf8")).toBe("a1\n");
    expect((await loadLock(fork))!.frameworkVersion).toBe("1.0.0");
  });

  it("refuses to write while a conflict is unresolved", async () => {
    expect(await upgradeCommand({ from: up, write: true, allowConflicts: false }, fork)).toBe(false);
    expect(await fs.readFile(path.join(fork, "schemas/a.schema.json"), "utf8")).toBe("a1\n");
  });

  it("with --allow-conflicts, applies everything else and leaves the conflict for a human", async () => {
    expect(await upgradeCommand({ from: up, write: true, allowConflicts: true }, fork)).toBe(true);

    expect(await fs.readFile(path.join(fork, "schemas/a.schema.json"), "utf8")).toBe("a2\n");
    expect(await fs.readFile(path.join(fork, "schemas/c.schema.json"), "utf8")).toBe("c2\n");
    await expect(fs.access(path.join(fork, "docs/old.md"))).rejects.toThrow();
    expect(await fs.readFile(path.join(fork, "schemas/b.schema.json"), "utf8")).toBe("b-acme\n");
    expect(await fs.readFile(path.join(fork, "README.md"), "utf8")).toBe("readme 1\n");
    expect(await fs.readFile(path.join(fork, "company/x.yaml"), "utf8")).toBe("acme's own company\n");

    expect((await loadLock(fork))!.frameworkVersion).toBe("1.1.0");
    const instance = await fs.readFile(path.join(fork, "cac.yaml"), "utf8");
    expect(instance).toContain("This comment must survive the upgrade.");
    expect(instance).toMatch(/version: 1\.1\.0/);

    // The unresolved conflict is now an undeclared deviation from 1.1.0.
    expect(failing(await checkBoundary(fork)).map((f) => [f.kind, f.path])).toEqual([
      ["modified", "schemas/b.schema.json"],
    ]);
  });

  it("is a no-op when upstream has not moved", async () => {
    await fs.rm(up, { recursive: true });
    await fs.mkdir(up);
    const plan = await planUpgrade(fork, (await loadLock(fork))!, (await loadLock(fork))!);
    expect(plan.actions.map((a) => a.kind)).toEqual(["keep-local"]);
  });

  it("refuses to run in upstream, and refuses to downgrade", async () => {
    expect(await upgradeCommand({ from: fork, write: false, allowConflicts: false }, up)).toBe(false);
    await publish(up, "0.9.0");
    expect(await upgradeCommand({ from: up, write: false, allowConflicts: false }, fork)).toBe(false);
  });

  it("flags lock paths that would reach outside the repository", () => {
    const lock = {
      apiVersion: API_VERSION,
      kind: "FrameworkLock",
      frameworkVersion: "9.9.9",
      boundary: { derived: [], instance: [], framework: [], adapt: [] },
      files: {
        framework: { "schemas/agent.schema.json": "a", "../outside.txt": "b", "/etc/passwd": "c", "cli/./x.ts": "d" },
        adapt: { "README.md": "e", "docs\\win.md": "f" },
      },
    } as unknown as Parameters<typeof unsafeLockPaths>[0];
    expect(unsafeLockPaths(lock).sort()).toEqual(["../outside.txt", "/etc/passwd", "cli/./x.ts", "docs\\win.md"].sort());
  });

  it("compares versions numerically, not as strings", () => {
    expect(compareVersions("0.10.0", "0.9.0")).toBe(1);
    expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
    expect(compareVersions("1.0.0", "1.0.1")).toBe(-1);
  });
});

describe("cac migrate", () => {
  const v1toA: Migration = {
    id: "9001",
    from: "test/v1",
    to: "test/v2",
    summary: "rename",
    apply: (t) => t.replace(/^apiVersion: test\/v1$/m, "apiVersion: test/v2"),
  };
  const v2toB: Migration = {
    id: "9002",
    from: "test/v2",
    to: "test/v3",
    summary: "rename again",
    apply: (t) => t.replace(/^apiVersion: test\/v2$/m, "apiVersion: test/v3"),
  };

  let root: string;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "cac-migrate-"));
  });
  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it("reads apiVersion from the document text, quoted or not", () => {
    expect(apiVersionOf("# c\napiVersion: test/v1\nkind: X\n")).toBe("test/v1");
    expect(apiVersionOf('apiVersion: "test/v1" # note\n')).toBe("test/v1");
    expect(apiVersionOf("kind: X\n")).toBeNull();
  });

  it("chains migrations in order and refuses a gap", () => {
    expect(chain("test/v1", "test/v3", [v2toB, v1toA])?.map((m) => m.id)).toEqual(["9001", "9002"]);
    expect(chain("test/v1", "test/v3", [v1toA])).toBeNull();
    expect(chain("test/v3", "test/v3", [])).toEqual([]);
  });

  it("migrates instance documents only, keeping comments, and reports documents it cannot move", async () => {
    await write(root, "company/a.yaml", "# keep me\napiVersion: test/v1\nkind: Task\n");
    await write(root, "company/b.yaml", "apiVersion: test/v3\nkind: Task\n");
    await write(root, "company/c.yaml", "apiVersion: other/v9\nkind: Task\n");
    await write(root, "templates/t.yaml", "apiVersion: test/v1\nkind: Task\n");

    const { steps, output } = await planMigration(root, "test/v3", [v1toA, v2toB]);
    expect(output.get("company/a.yaml")).toBe("# keep me\napiVersion: test/v3\nkind: Task\n");
    expect(output.has("company/b.yaml")).toBe(false);
    expect(output.has("templates/t.yaml")).toBe(false);
    expect(steps.find((s) => s.file === "company/c.yaml")?.stuck).toMatch(/no migration path/);
  });
});

describe("migration 0001: v1 → v1alpha1", () => {
  it("renames the version on apiVersion and frameworkVersion lines and nowhere else", async () => {
    const { m0001 } = await import("../src/migrations/0001-v1-to-v1alpha1.js");
    const before = [
      "# A comment mentioning company-as-code/v1 stays as written.",
      "apiVersion: company-as-code/v1",
      "kind: HubModule",
      'frameworkVersion: "company-as-code/v1" # pinned',
      "description: Targets company-as-code/v1 documents.",
      "",
    ].join("\n");
    const after = m0001.apply(before);
    expect(after).toBe(
      [
        "# A comment mentioning company-as-code/v1 stays as written.",
        "apiVersion: company-as-code/v1alpha1",
        "kind: HubModule",
        'frameworkVersion: "company-as-code/v1alpha1" # pinned',
        "description: Targets company-as-code/v1 documents.",
        "",
      ].join("\n"),
    );
    expect(m0001.apply(after)).toBe(after);
  });
});
