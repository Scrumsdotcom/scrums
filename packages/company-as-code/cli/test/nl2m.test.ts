import { describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { parseProse, allocateIds, synthesize, nl2mCommand } from "../src/nl2m.js";
import { REPO_ROOT } from "../src/paths.js";

describe("NL2M, natural language to manifest", () => {
  it("extracts domain, direction, target and horizon from confident prose", () => {
    const intent = parseProse(
      "We want to reduce CAC payback to 9 months by Q4 so the growth engine is self-funding.",
    );
    expect(intent.domain).toBe("sales-marketing");
    expect(intent.codeDomain).toBe("sales-marketing");
    expect(intent.target.comparator).toBe("lte");
    expect(intent.target.value).toBe(9);
    expect(intent.metricUnit).toBe("months");
    expect(intent.metricType).toBe("duration");
    expect(intent.goalType).toBe("sla");
    expect(intent.horizonPeriod).toBe("quarterly");
    expect(intent.review).toEqual([]);
  });

  it("detects a percentage target and an upward direction", () => {
    const intent = parseProse("Increase trial-to-paid conversion to 25% this quarter.");
    expect(intent.domain).toBe("sales-marketing");
    expect(intent.target.comparator).toBe("gte");
    expect(intent.target.value).toBe(25);
    expect(intent.target.unit).toBe("%");
    expect(intent.metricType).toBe("percentage");
  });

  it("detects a currency target", () => {
    const intent = parseProse("Grow monthly recurring revenue to $500000 by year end.");
    expect(intent.target.value).toBe(500000);
    expect(intent.target.unit).toBe("USD");
    expect(intent.metricType).toBe("currency");
    expect(intent.horizonPeriod).toBe("yearly");
  });

  it("records review markers when the prose is vague", () => {
    const intent = parseProse("Improve things a lot.");
    expect(intent.review.length).toBeGreaterThan(0);
    expect(intent.review.join(" ")).toMatch(/target\.value/);
    // Still produces a usable, well-formed intent.
    expect(intent.title).toBe("Improve things a lot");
    expect(intent.target.comparator).toBe("gte");
  });

  it("allocates IDs that do not collide with the existing corpus", async () => {
    const intent = parseProse("Reduce CAC payback to 8 months.");
    const ids = await allocateIds(intent);
    expect(ids.initiativeId).toMatch(/^INIT-GROWTH-\d{4}$/);
    expect(ids.goalId).toMatch(/^GOAL-GROWTH-\d{4}$/);
    // METRIC-GROWTH-CAC-PAYBACK already exists in the seed corpus, so the
    // slug-based ID must be de-duped.
    expect(ids.metricId).not.toBe("METRIC-GROWTH-CAC-PAYBACK");
    expect(ids.metricId).toMatch(/^METRIC-GROWTH-[A-Z0-9-]+$/);
  });

  it("synthesizes a fully linked Initiative + Goal + Metric triple", async () => {
    const intent = parseProse("Reduce monthly burn to $200000 within the quarter.");
    const ids = await allocateIds(intent);
    const { initiative, goal, metric } = synthesize(intent, ids, {
      owner: "team:finance",
      today: "2026-05-14",
    });
    expect(initiative.data.id).toBe(ids.initiativeId);
    expect(initiative.data.goals).toEqual([ids.goalId]);
    expect(initiative.data.metrics).toEqual([ids.metricId]);
    expect(goal.data.metric).toBe(ids.metricId);
    expect(goal.data.initiatives).toEqual([ids.initiativeId]);
    expect(metric.data.id).toBe(ids.metricId);
    // File paths land in the right corpus folders.
    expect(initiative.file).toMatch(/^company\/initiatives\//);
    expect(goal.file).toMatch(/^company\/goals\//);
    expect(metric.file).toMatch(/^company\/metrics\//);
  });

  it("dry-run command validates the output and writes nothing", async () => {
    const ok = await nl2mCommand({
      prose: "Cut deploy lead time to 30 minutes to improve platform reliability.",
      write: false,
      today: "2026-05-14",
    });
    expect(ok).toBe(true);
    // Confirm nothing leaked into /company.
    const initiatives = await fs.readdir(path.join(REPO_ROOT, "company/initiatives"));
    expect(initiatives.some((f) => f.includes("deploy-lead-time"))).toBe(false);
  });
});
