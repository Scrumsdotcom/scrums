import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";
import {
  BOUNDARY,
  LOCK_FILE,
  checkBoundary,
  classify,
  computeLock,
  failing,
  initCommand,
  instanceYaml,
  loadInstance,
  serializeLock,
  type InstanceConfig,
} from "../src/boundary.js";
import { API_VERSION } from "../src/version.js";

const upstream: InstanceConfig = {
  apiVersion: API_VERSION,
  kind: "Instance",
  name: "Upstream",
  role: "upstream",
  namespace: "cac",
  framework: { version: "1.2.3", upstream: "https://example.invalid/upstream" },
};

async function write(root: string, rel: string, content: string) {
  const full = path.join(root, rel);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, "utf8");
}

/** A tiny upstream tree with a published lock. */
async function seedUpstream(root: string) {
  await write(root, "package.json", JSON.stringify({ version: "1.2.3" }));
  await write(root, "schemas/a.schema.json", "{}\n");
  await write(root, "docs/adr/0001-first.md", "# 1\n");
  await write(root, "hub/modules/shared/hub-module.yaml", "name: shared\n");
  await write(root, "README.md", "upstream readme\n");
  await write(root, "company/x.yaml", "kind: Task\n");
  await write(root, "cac.yaml", instanceYaml(upstream));
  await write(root, LOCK_FILE, serializeLock(await computeLock(root, upstream)));
}

async function becomeFork(root: string, extra: Partial<InstanceConfig> = {}) {
  const fork: InstanceConfig = { ...upstream, name: "Acme", role: "fork", namespace: "acme", ...extra };
  await write(root, "cac.yaml", instanceYaml(fork));
}

describe("boundary classification", () => {
  it("puts every seeded path in exactly the class the standard documents", () => {
    expect(classify("company/domains/x/manifest.yaml", upstream)).toBe("instance");
    expect(classify("generated/agent-catalogue.json", upstream)).toBe("derived");
    expect(classify(LOCK_FILE, upstream)).toBe("derived");
    expect(classify("schemas/agent.schema.json", upstream)).toBe("framework");
    expect(classify("README.md", upstream)).toBe("adapt");
    expect(classify("docs/governance/stewardship.md", upstream)).toBe("instance");
    expect(classify("docs/governance.md", upstream)).toBe("framework");
    expect(classify("somewhere-new.txt", upstream)).toBeNull();
  });

  it("gives a fork its own namespaced hub modules and nothing else under hub/", () => {
    const fork = { ...upstream, role: "fork" as const, namespace: "acme" };
    expect(classify("hub/modules/acme-billing/hub-module.yaml", fork)).toBe("instance");
    expect(classify("hub/modules/billing/hub-module.yaml", fork)).toBe("framework");
    expect(classify("hub/modules/acme-billing/hub-module.yaml", upstream)).toBe("framework");
  });

  it("never lets a pattern class overlap silently: derived and instance win over framework", () => {
    for (const cls of Object.keys(BOUNDARY) as (keyof typeof BOUNDARY)[]) {
      for (const p of BOUNDARY[cls]) {
        expect(p.includes("*") ? p.endsWith("/**") && !p.slice(0, -3).includes("*") : true, p).toBe(true);
      }
    }
  });
});

describe("boundary check", () => {
  let root: string;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "cac-boundary-"));
    await seedUpstream(root);
  });
  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it("upstream: a current lock is clean and an edited framework file makes it stale", async () => {
    expect(failing(await checkBoundary(root))).toEqual([]);
    await write(root, "schemas/a.schema.json", '{"changed":true}\n');
    const kinds = failing(await checkBoundary(root)).map((f) => f.kind);
    expect(kinds).toContain("lock-stale");
  });

  it("upstream: an unclassified path is a problem, not a silent omission from the lock", async () => {
    await write(root, "stray.txt", "x\n");
    const found = failing(await checkBoundary(root));
    expect(found.map((f) => [f.kind, f.path])).toContainEqual(["unclassified", "stray.txt"]);
  });

  it("fork: untouched framework files and edited company files are clean", async () => {
    await becomeFork(root);
    await write(root, "company/x.yaml", "kind: Task\nid: changed\n");
    await write(root, "README.md", "our readme\n");
    expect(failing(await checkBoundary(root))).toEqual([]);
  });

  it("fork: an edited framework file is reported, and declaring it turns the failure into a note", async () => {
    await becomeFork(root);
    await write(root, "schemas/a.schema.json", '{"forked":true}\n');
    let report = await checkBoundary(root);
    expect(failing(report).map((f) => [f.kind, f.path])).toEqual([["modified", "schemas/a.schema.json"]]);

    await becomeFork(root, {
      deviations: [{ path: "schemas/a.schema.json", reason: "We need a stricter enum until upstream ships it." }],
    });
    report = await checkBoundary(root);
    expect(failing(report)).toEqual([]);
    expect(report.findings.filter((f) => f.declared).map((f) => f.path)).toEqual(["schemas/a.schema.json"]);
  });

  it("fork: a deleted framework file is reported as missing", async () => {
    await becomeFork(root);
    await fs.rm(path.join(root, "schemas/a.schema.json"));
    expect(failing(await checkBoundary(root)).map((f) => f.kind)).toEqual(["missing"]);
  });

  it("fork: an ADR added to upstream's numbering is pointed at company/decisions/", async () => {
    await becomeFork(root);
    await write(root, "docs/adr/0002-ours.md", "# ours\n");
    const [finding] = failing(await checkBoundary(root));
    expect(finding?.kind).toBe("added");
    expect(finding?.message).toMatch(/company\/decisions\//);
  });

  it("fork: hub modules must carry the fork's namespace", async () => {
    await becomeFork(root);
    await write(root, "hub/modules/acme-payroll/hub-module.yaml", "name: acme-payroll\n");
    expect(failing(await checkBoundary(root))).toEqual([]);

    await write(root, "hub/modules/payroll/hub-module.yaml", "name: payroll\n");
    const [finding] = failing(await checkBoundary(root));
    expect(finding?.path).toBe("hub/modules/payroll/hub-module.yaml");
    expect(finding?.message).toMatch(/acme-<name>/);
  });

  it("fork: without the lock, the fork is told it cannot tell its edits from upstream's", async () => {
    await becomeFork(root);
    await fs.rm(path.join(root, LOCK_FILE));
    expect(failing(await checkBoundary(root)).map((f) => f.kind)).toContain("no-lock");
  });

  it("a tree with no cac.yaml says so", async () => {
    await fs.rm(path.join(root, "cac.yaml"));
    const report = await checkBoundary(root);
    expect(report.role).toBeNull();
    expect(failing(report).map((f) => f.kind)).toEqual(["no-instance"]);
  });
});

describe("cac init", () => {
  let root: string;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "cac-init-"));
    await seedUpstream(root);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(root, { recursive: true, force: true });
  });

  it("is a dry run by default", async () => {
    expect(await initCommand({ name: "Acme", namespace: "acme", write: false }, root)).toBe(true);
    expect((await loadInstance(root))?.role).toBe("upstream");
  });

  it("writes a fork declaration pinned to the release in the lock", async () => {
    expect(await initCommand({ name: "Acme", namespace: "acme", write: true }, root)).toBe(true);
    const parsed = YAML.parse(await fs.readFile(path.join(root, "cac.yaml"), "utf8"));
    expect(parsed).toMatchObject({ role: "fork", namespace: "acme", name: "Acme", framework: { version: "1.2.3" } });
    expect(failing(await checkBoundary(root))).toEqual([]);
  });

  it("rejects a namespace that could not prefix a hub module name", async () => {
    expect(await initCommand({ name: "Acme", namespace: "Acme-Co", write: true }, root)).toBe(false);
  });

  it("refuses to re-initialise a tree that is already a fork", async () => {
    await becomeFork(root);
    expect(await initCommand({ name: "Other", namespace: "other", write: true }, root)).toBe(false);
  });
});
