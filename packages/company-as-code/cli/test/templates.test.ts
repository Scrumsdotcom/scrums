import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { describe, expect, it } from "vitest";
import { buildAjv } from "../src/validate.js";
import { loadSchemas, schemaForKind } from "../src/loader.js";
import { REPO_ROOT } from "../src/paths.js";

/**
 * Every authoring template under /templates must validate against its schema
 * exactly as shipped. The getting-started walkthrough's first hands-on step
 * is `cp templates/... company/... && npm run validate` — a template that
 * fails the project's own validator on first contact is a release blocker.
 */

const TEMPLATE_DIR = path.join(REPO_ROOT, "templates");

describe("authoring templates", () => {
  it("every YAML template is schema-valid as shipped", async () => {
    const schemas = await loadSchemas();
    const ajv = buildAjv(schemas);
    const files = (await fs.readdir(TEMPLATE_DIR)).filter((f) => f.endsWith(".yaml"));
    expect(files.length).toBeGreaterThan(0);

    const failures: string[] = [];
    for (const f of files) {
      const doc = YAML.parse(await fs.readFile(path.join(TEMPLATE_DIR, f), "utf8"));
      const kind = doc?.kind;
      const schemaFile = kind ? schemaForKind(kind) : undefined;
      if (!schemaFile) {
        failures.push(`${f}: kind '${kind}' has no schema — template cannot be validated`);
        continue;
      }
      const validate = ajv.getSchema(schemaFile)!;
      if (!validate(doc)) {
        const errs = (validate.errors ?? [])
          .map((e) => `${e.instancePath || "(root)"} ${e.message}`)
          .join("; ");
        failures.push(`${f}: ${errs}`);
      }
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });
});
