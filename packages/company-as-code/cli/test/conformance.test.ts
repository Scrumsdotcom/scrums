import { describe, expect, it } from "vitest";
import { compare, loadCases, referenceVerdict } from "../src/conformance.js";

describe("conformance suite", async () => {
  const cases = await loadCases();

  it("has at least one case for every rule, and one valid case", () => {
    const prefixes = new Set(cases.map((c) => c.id[0]));
    for (const p of ["v", "c", "s", "r", "x"]) expect(prefixes, `no '${p}' case`).toContain(p);
  });

  it("gives every case a unique id matching its folder", () => {
    const ids = cases.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of cases) expect(c.dir.endsWith(c.id), c.id).toBe(true);
  });

  for (const c of cases) {
    it(`reference implementation passes ${c.id}`, async () => {
      expect(compare(c.expect, await referenceVerdict(c.dir))).toEqual([]);
    });
  }
});

describe("verdict comparison", () => {
  const expected = { valid: false, failures: [{ rule: "reference" as const, file: "company/a.yaml" }] };

  it("fails an implementation that is too lenient", () => {
    expect(compare(expected, { valid: true, failures: [] })).toEqual([
      "expected valid=false, got valid=true",
      "missing failure: reference company/a.yaml",
    ]);
  });

  it("fails an implementation that is too strict", () => {
    const actual = {
      valid: false,
      failures: [...expected.failures, { rule: "schema" as const, file: "company/a.yaml" }],
    };
    expect(compare(expected, actual)).toEqual(["unexpected failure: schema company/a.yaml"]);
  });
});
