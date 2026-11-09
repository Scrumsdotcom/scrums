import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";
import { orgChart, parseCsv } from "../src/importers/org-chart.js";
import { importAcceptCommand, importDraftCommand } from "../src/import.js";
import { buildAjv } from "../src/validate.js";
import { loadSchemas } from "../src/loader.js";

const CSV = [
  "id,name,email,title,team,type,lead",
  "17,Ada Lovelace,ada@example.com,Head of Finance,Finance,employee,yes",
  '18,"Hopper, Grace",grace@example.com,"Platform Engineer, ""SRE""",Platform,,',
  "19,Ada Lovelace,ada2@example.com,Analyst,Finance,intern,",
  ",,,,,,",
  "",
].join("\n");

describe("CSV reader", () => {
  it("handles quoted commas, doubled quotes, CRLF, and blank rows", () => {
    expect(parseCsv('a,b\r\n"x, y","say ""hi"""\r\n,\r\n')).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"'],
    ]);
  });
});

describe("org-chart importer", () => {
  const { drafts, warnings } = orgChart.draft(CSV, { source: "people.csv" });
  const byId = Object.fromEntries(drafts.map((d) => [d.id, d.data as any]));

  it("drafts one Person per row and one Organization per team, all proposed", () => {
    expect(Object.keys(byId).sort()).toEqual([
      "ORG-FINANCE",
      "ORG-PLATFORM",
      "PERSON-ADA-LOVELACE",
      "PERSON-ADA-LOVELACE-2",
      "PERSON-HOPPER-GRACE",
    ]);
    for (const d of drafts) expect((d.data as any).status).toBe("proposed");
  });

  it("links people and teams both ways, and keeps the source ID", () => {
    expect(byId["ORG-FINANCE"].members).toEqual(["PERSON-ADA-LOVELACE", "PERSON-ADA-LOVELACE-2"]);
    expect(byId["ORG-FINANCE"].leads).toEqual(["PERSON-ADA-LOVELACE"]);
    expect(byId["PERSON-HOPPER-GRACE"].roles).toEqual([{ title: 'Platform Engineer, "SRE"', organization: "ORG-PLATFORM" }]);
    expect(byId["PERSON-ADA-LOVELACE"].externalIds).toEqual([{ system: "org-chart-import", id: "17" }]);
  });

  it("warns about likely duplicates and unknown types instead of guessing silently", () => {
    expect(warnings.some((w) => w.includes("PERSON-ADA-LOVELACE-2"))).toBe(true);
    expect(warnings.some((w) => w.includes("unknown type 'intern'"))).toBe(true);
  });

  it("produces drafts that validate against the framework schemas", async () => {
    const ajv = buildAjv(await loadSchemas());
    for (const d of drafts) {
      const validate = ajv.getSchema(`${d.kind.toLowerCase()}.schema.json`)!;
      expect(validate(d.data), `${d.id}: ${JSON.stringify(validate.errors)}`).toBe(true);
    }
  });

  it("refuses a file with no name column", () => {
    const res = orgChart.draft("email\nada@example.com\n", { source: "x.csv" });
    expect(res.drafts).toEqual([]);
    expect(res.warnings[0]).toMatch(/no 'name' column/);
  });
});

describe("cac import, end to end", () => {
  let tmp: string;
  let company: string;
  let drafts: string;
  let csv: string;

  beforeEach(async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), "cac-import-"));
    company = path.join(tmp, "company");
    drafts = path.join(company, ".drafts");
    csv = path.join(tmp, "people.csv");
    await fs.writeFile(csv, CSV, "utf8");
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it("drafts nothing without --write, then drafts into the hidden drafts folder", async () => {
    expect(await importDraftCommand("org-chart", { file: csv, write: false }, drafts)).toBe(true);
    await expect(fs.access(drafts)).rejects.toThrow();

    expect(await importDraftCommand("org-chart", { file: csv, write: true }, drafts)).toBe(true);
    const text = await fs.readFile(path.join(drafts, "org-chart/people/PERSON-ADA-LOVELACE.yaml"), "utf8");
    expect(text).toMatch(/^# Drafted by 'cac import org-chart' from people\.csv\./);
    expect(YAML.parse(text).status).toBe("proposed");
  });

  it("accepts drafts into company/ only with --write, and never overwrites an existing identity", async () => {
    await importDraftCommand("org-chart", { file: csv, write: true }, drafts);

    expect(await importAcceptCommand("org-chart", { into: "company/people", write: false }, drafts, company)).toBe(true);
    await expect(fs.access(path.join(company, "people"))).rejects.toThrow();

    expect(await importAcceptCommand("org-chart", { into: "company/people", write: true }, drafts, company)).toBe(true);
    expect((await fs.readdir(path.join(company, "people"))).sort()).toContain("PERSON-HOPPER-GRACE.yaml");

    await fs.writeFile(csv, "name\nCFO\n", "utf8");
    await importDraftCommand("org-chart", { file: csv, write: true }, drafts);
    expect(await importAcceptCommand("org-chart", { into: "company/people", write: true }, drafts, company)).toBe(false);
  });

  it("refuses to accept outside company/", async () => {
    await importDraftCommand("org-chart", { file: csv, write: true }, drafts);
    expect(await importAcceptCommand("org-chart", { into: "../elsewhere", write: true }, drafts, company)).toBe(false);
  });
});
