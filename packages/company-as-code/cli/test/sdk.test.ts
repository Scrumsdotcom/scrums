import { describe, expect, it } from "vitest";
import { sdkFiles } from "../src/sdk.js";
import { loadSchemas } from "../src/loader.js";

describe("schema-driven SDK generator", () => {
  it("emits a TypeScript + Python file for every schema, plus barrels and a README", async () => {
    const schemas = await loadSchemas();
    const files = sdkFiles(schemas);
    const names = files.map((f) => f.name);

    const schemaCount = Object.keys(schemas).length;
    // one .ts + one .py per schema, plus index.ts, __init__.py, README.md
    expect(files.length).toBe(schemaCount * 2 + 3);
    expect(names).toContain("sdk/typescript/index.ts");
    expect(names).toContain("sdk/python/__init__.py");
    expect(names).toContain("sdk/README.md");
    for (const n of names) expect(n.startsWith("sdk/")).toBe(true);
  });

  it("is deterministic — identical schemas produce byte-identical output", async () => {
    const schemas = await loadSchemas();
    const a = sdkFiles(schemas);
    const b = sdkFiles(schemas);
    expect(JSON.stringify(b)).toEqual(JSON.stringify(a));
  });

  it("projects enums as string-literal unions and const as a literal type", async () => {
    const schemas = await loadSchemas();
    const files = sdkFiles(schemas);
    const goalTs = files.find((f) => f.name === "sdk/typescript/goal.ts")!;
    expect(goalTs.content).toContain('kind: "Goal";');
    expect(goalTs.content).toContain(
      'type: "kpi" | "okr" | "sla" | "target" | "guardrail";',
    );
    // nested object inlined
    expect(goalTs.content).toMatch(/owner: \{\s+kind:/);
  });

  it("projects $defs as named types reused by $ref", async () => {
    const schemas = await loadSchemas();
    const files = sdkFiles(schemas);
    const policyTs = files.find(
      (f) => f.name === "sdk/typescript/autonomy-policy.ts",
    )!;
    // $defs/class -> interface Class, referenced by the classes block
    expect(policyTs.content).toContain("export interface Class ");
    expect(policyTs.content).toMatch(/autonomous: Class;/);
  });

  it("marks required vs optional fields correctly in both targets", async () => {
    const schemas = await loadSchemas();
    const files = sdkFiles(schemas);
    const goalTs = files.find((f) => f.name === "sdk/typescript/goal.ts")!;
    expect(goalTs.content).toContain("id: string;"); // required
    expect(goalTs.content).toContain("description?: string;"); // optional

    const goalPy = files.find((f) => f.name === "sdk/python/goal.py")!;
    expect(goalPy.content).toContain("from __future__ import annotations");
    expect(goalPy.content).toMatch(/description: NotRequired\[str\]/);
  });

  it("enforces required fields in Python — never total=False, required fields bare", async () => {
    const schemas = await loadSchemas();
    const files = sdkFiles(schemas);
    const pyFiles = files.filter((f) => f.name.endsWith(".py"));
    expect(pyFiles.length).toBeGreaterThan(0);
    for (const f of pyFiles) {
      // total=False silently turns NotRequired into a no-op and lets an
      // empty dict type-check as a valid document.
      expect(f.content, f.name).not.toContain("total=False");
    }
    const goalPy = files.find((f) => f.name === "sdk/python/goal.py")!;
    // Required fields must be bare (enforced), not NotRequired.
    expect(goalPy.content).toMatch(/^    id: str$/m);
    expect(goalPy.content).not.toMatch(/id: NotRequired\[str\]/);
  });

  it("emits `pass` when every key of a TypedDict falls back to a comment", async () => {
    const schemas = await loadSchemas();
    const files = sdkFiles(schemas);
    // escalation-policy severities are keyed `sev-1`..`sev-4` — hyphens are
    // not valid Python identifiers, so all fields become comments and the
    // class body needs an explicit `pass` to parse.
    const py = files.find((f) => f.name === "sdk/python/escalation_policy.py")!;
    expect(py.content).toMatch(/class EscalationPolicySeverities\(TypedDict\):\n(    #[^\n]*\n)+    pass\n/);
  });

  it("projects non-object $defs as aliases, not interfaces/TypedDicts", async () => {
    const schemas = await loadSchemas();
    const files = sdkFiles(schemas);
    const eventTs = files.find((f) => f.name === "sdk/typescript/event.ts")!;
    expect(eventTs.content).toContain("export type EventType = string;");
    expect(eventTs.content).not.toContain("export interface EventType");
    const eventPy = files.find((f) => f.name === "sdk/python/event.py")!;
    expect(eventPy.content).toContain("EventType = str");
    expect(eventPy.content).not.toContain("class EventType(TypedDict)");
  });
});
