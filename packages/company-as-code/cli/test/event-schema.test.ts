import { describe, expect, it } from "vitest";
import { buildAjv } from "../src/validate.js";
import { loadCorpus, loadSchemas } from "../src/loader.js";

/**
 * The Event schema and the EventTypeRegistry schema each carry a local
 * $defs.eventType. They must agree. A registered event type that fails the
 * Event row schema means every row of that type is rejected the moment a
 * fork starts validating its ledger.
 */

describe("event schema ↔ event type registry", () => {
  it("keeps the eventType pattern identical in both schemas", async () => {
    const schemas = await loadSchemas();
    const eventPattern = (schemas["event.schema.json"] as any).$defs.eventType.pattern;
    const registryPattern = (schemas["event-type-registry.schema.json"] as any).$defs.eventType
      .pattern;
    expect(eventPattern).toBe(registryPattern);
  });

  it("accepts a sample Event row for every registered event type", async () => {
    const schemas = await loadSchemas();
    const ajv = buildAjv(schemas);
    const validate = ajv.getSchema("event.schema.json")!;
    const corpus = await loadCorpus();
    const registry = corpus.eventTypeRegistries[0];
    expect(registry).toBeDefined();
    const types = (registry.data.events as Array<{ type: string }>).map((e) => e.type);
    expect(types.length).toBeGreaterThan(0);
    for (const type of types) {
      const sample = {
        apiVersion: "company-as-code/v1",
        kind: "Event",
        id: "01J0000000000000000000TEST",
        type,
        entity: { canonicalId: "task:demo", kind: "task" },
        occurredAt: "2026-07-02T00:00:00Z",
        actor: { kind: "system", id: "runtime-host" },
      };
      const ok = validate(sample);
      expect(ok, `registered type '${type}' must satisfy event.schema.json: ${JSON.stringify(validate.errors)}`).toBe(true);
    }
  });

  it("still rejects malformed event types", async () => {
    const schemas = await loadSchemas();
    const ajv = buildAjv(schemas);
    const validate = ajv.getSchema("event.schema.json")!;
    for (const bad of ["NoDots", "Upper.case", "task.", ".task", "task", "task.State_Changed"]) {
      const sample = {
        apiVersion: "company-as-code/v1",
        kind: "Event",
        id: "01J0000000000000000000TEST",
        type: bad,
        entity: { canonicalId: "task:demo", kind: "task" },
        occurredAt: "2026-07-02T00:00:00Z",
        actor: { kind: "system", id: "runtime-host" },
      };
      expect(validate(sample), `'${bad}' should be rejected`).toBe(false);
    }
  });
});
