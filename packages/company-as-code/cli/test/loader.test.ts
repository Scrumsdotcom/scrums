import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadCorpusWithDiagnostics } from "../src/loader.js";
import { unclassifiedErrors } from "../src/validate.js";
import { COMPANY_DIR } from "../src/paths.js";

/**
 * The loader must never silently drop a /company document: a one-character
 * `kind:` typo escaping validation is exactly the failure mode the validator
 * exists to catch. These tests write scratch fixtures into /company and
 * remove them afterwards (the loader is not yet repo-agnostic).
 */

const SCRATCH = path.join(COMPANY_DIR, "test-scratch-loader");

afterEach(async () => {
  await fs.rm(SCRATCH, { recursive: true, force: true });
});

async function writeFixture(name: string, content: string): Promise<void> {
  await fs.mkdir(SCRATCH, { recursive: true });
  await fs.writeFile(path.join(SCRATCH, name), content, "utf8");
}

describe("loadCorpusWithDiagnostics", () => {
  it("reports a misspelled kind as unclassified instead of dropping it", async () => {
    await writeFixture(
      "typo-kind.yaml",
      "apiVersion: company-as-code/v1\nkind: Agnet\nname: typo-agent\n",
    );
    const { unclassified } = await loadCorpusWithDiagnostics();
    const hit = unclassified.find((u) => u.file.endsWith("typo-kind.yaml"));
    expect(hit).toBeDefined();
    expect(hit!.reason).toBe("unknown-kind");
    expect(hit!.kind).toBe("Agnet");
    expect(unclassifiedErrors([hit!])[0]).toContain("unrecognized kind 'Agnet'");
  });

  it("reports a document with no kind as unclassified", async () => {
    await writeFixture("no-kind.yaml", "apiVersion: company-as-code/v1\nname: nameless\n");
    const { unclassified } = await loadCorpusWithDiagnostics();
    const hit = unclassified.find((u) => u.file.endsWith("no-kind.yaml"));
    expect(hit).toBeDefined();
    expect(hit!.reason).toBe("missing-kind");
  });

  it("allows intentional non-primitive YAML via the cac:ignore pragma", async () => {
    await writeFixture(
      "ignored.yaml",
      "# cac:ignore, intentional non-primitive fixture\nfoo: bar\n",
    );
    const { unclassified } = await loadCorpusWithDiagnostics();
    expect(unclassified.find((u) => u.file.endsWith("ignored.yaml"))).toBeUndefined();
  });

  it("classifies the shipped corpus with zero unclassified files", async () => {
    const { unclassified } = await loadCorpusWithDiagnostics();
    expect(unclassified).toEqual([]);
  });
});
