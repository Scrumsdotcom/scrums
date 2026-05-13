import { describe, expect, it, afterEach } from "vitest";
import { SqliteSinks } from "../src/sinks/sqlite.js";
import type { AuditRecord, TypedEvent } from "../src/types.js";

let sinks: SqliteSinks | undefined;
afterEach(() => {
  sinks?.close();
  sinks = undefined;
});

function mkAudit(over: Partial<AuditRecord> = {}): AuditRecord {
  return {
    apiVersion: "company-as-code/v1",
    kind: "AuditRecord",
    id: over.id ?? "a-1",
    actor: { kind: "person", id: "people:finance-lead" },
    action: "test.action",
    startedAt: "2026-05-13T00:00:00.000Z",
    status: "success",
    dryRun: false,
    correlationId: "corr-1",
    ...over,
  };
}

function mkEvent(over: Partial<TypedEvent> = {}): TypedEvent {
  return {
    apiVersion: "company-as-code/v1",
    kind: "Event",
    id: over.id ?? "e-1",
    type: "finance.period_closed",
    entity: { canonicalId: "PERIOD-2026-04", kind: "period" },
    occurredAt: "2026-05-13T00:00:00.000Z",
    actor: { kind: "system", id: "runtime-host" },
    correlationId: "corr-1",
    ...over,
  };
}

describe("SqliteSinks (in-memory)", () => {
  it("records and retrieves audit rows by correlation in startedAt order", async () => {
    sinks = new SqliteSinks(":memory:");
    const audit = sinks.audit();
    await audit.record(mkAudit({ id: "a-1", action: "step.agent", startedAt: "2026-05-13T00:00:01Z" }));
    await audit.record(mkAudit({ id: "a-2", action: "step.dry-run", dryRun: true, startedAt: "2026-05-13T00:00:02Z" }));
    await audit.record(mkAudit({ id: "a-3", action: "human-approval", actor: { kind: "person", id: "people:finance-lead" }, startedAt: "2026-05-13T00:00:03Z" }));
    const rows = await audit.byCorrelation("corr-1");
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.action)).toEqual(["step.agent", "step.dry-run", "human-approval"]);
    expect(rows[1].dryRun).toBe(true);
  });

  it("preserves JSON input/output payloads round-trip", async () => {
    sinks = new SqliteSinks(":memory:");
    const audit = sinks.audit();
    const payload = { period: "2026-04", actor: "people:finance-lead", nested: { a: 1, b: [true, false] } };
    await audit.record(mkAudit({ id: "a-pl", input: payload, output: { delta: 42 } }));
    const [row] = await audit.byCorrelation("corr-1");
    expect(row.input).toEqual(payload);
    expect(row.output).toEqual({ delta: 42 });
  });

  it("records and retrieves events by type and by entity", async () => {
    sinks = new SqliteSinks(":memory:");
    const events = sinks.events();
    await events.emit(mkEvent({ id: "e-1", type: "finance.period_closed" }));
    await events.emit(mkEvent({ id: "e-2", type: "finance.cash_forecast_updated", entity: { canonicalId: "FORECAST-2026-W19", kind: "forecast" } }));
    const byTypeClose = await events.byType("finance.period_closed");
    expect(byTypeClose).toHaveLength(1);
    expect(byTypeClose[0].id).toBe("e-1");
    const byEntityPeriod = await events.byEntity("PERIOD-2026-04");
    expect(byEntityPeriod).toHaveLength(1);
    expect(byEntityPeriod[0].id).toBe("e-1");
  });
});
