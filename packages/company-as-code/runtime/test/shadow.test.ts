import { describe, expect, it, afterEach } from "vitest";
import { SqliteShadowStore } from "../src/shadow/evidence-store.js";
import { ShadowAgentInvoker } from "../src/shadow/shadow-invoker.js";
import { evaluatePromotion } from "../src/shadow/evaluate.js";
import { generateAdrProposal, nextAdrNumber } from "../src/shadow/adr-proposal.js";
import type { AgentInvoker } from "../src/executor/runner.js";
import type { RepoIndex } from "../src/loader/repo.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");

let store: SqliteShadowStore | undefined;
afterEach(() => {
  store?.close();
  store = undefined;
});

const POLICY = {
  promotion: {
    fromHumanGatedToAutonomous: {
      requires: {
        successfulSyncVerificationInvocations: ">= 3",
        shadowModeDays: ">= 14",
        shadowAgreementRate: ">= 0.95",
        acceptedADR: "required",
        manifestUpdate: "required",
      },
    },
  },
};

describe("SqliteShadowStore — reliability evidence", () => {
  it("enrolls an agent and reports it as shadowing", () => {
    store = new SqliteShadowStore(":memory:");
    const e = store.enroll("cash-forecaster");
    expect(e.status).toBe("shadow");
    expect(store.isShadowing("cash-forecaster")).toBe(true);
    expect(store.isShadowing("not-enrolled")).toBe(false);
  });

  it("accumulates runs and observations into an evidence aggregate", () => {
    store = new SqliteShadowStore(":memory:");
    store.enroll("a");
    store.recordRun({ agent: "a", traceId: "t1", projectionHash: "h1" });
    store.recordRun({ agent: "a", traceId: "t2", projectionHash: "h2" });
    store.recordRun({ agent: "a", traceId: "t2", projectionHash: "h3" });
    store.observe("a", true); // most recent un-observed
    store.observe("a", true);
    store.observe("a", false);

    const ev = store.evidence("a");
    expect(ev.totalRuns).toBe(3);
    expect(ev.observedRuns).toBe(3);
    expect(ev.matchedRuns).toBe(2);
    expect(ev.agreementRate).toBeCloseTo(2 / 3);
    expect(ev.distinctTraces).toBe(2);
  });

  it("observe throws when there is no un-observed run", () => {
    store = new SqliteShadowStore(":memory:");
    store.enroll("a");
    expect(() => store!.observe("a", true)).toThrow(/no un-observed/);
  });

  it("withdraw retains the enrollment and evidence", () => {
    store = new SqliteShadowStore(":memory:");
    store.enroll("a");
    store.recordRun({ agent: "a" });
    store.setStatus("a", "withdrawn");
    expect(store.isShadowing("a")).toBe(false);
    expect(store.evidence("a").totalRuns).toBe(1);
  });
});

describe("ShadowAgentInvoker", () => {
  const fakeRepo = {} as RepoIndex;
  const inner: AgentInvoker = {
    async invoke(args) {
      return {
        output: { agent: args.agent, sawDryRun: args.dryRun },
        emittedEvent: {
          apiVersion: "company-as-code/v1",
          kind: "Event",
          id: "e1",
          type: "test.thing_happened",
          entity: { canonicalId: "x", kind: "thing" },
          occurredAt: new Date().toISOString(),
          actor: { kind: "system", id: "test" },
        },
      };
    },
  };

  it("is a transparent pass-through for an agent not in shadow mode", async () => {
    store = new SqliteShadowStore(":memory:");
    const wrapped = new ShadowAgentInvoker(inner, store);
    const r = await wrapped.invoke({
      agent: "not-shadowing",
      correlationId: "c1",
      dryRun: false,
      repo: fakeRepo,
    });
    expect((r.output as any).sawDryRun).toBe(false);
    expect(r.emittedEvent).toBeDefined();
  });

  it("forces dry-run, records evidence, and strips the emitted event for a shadow agent", async () => {
    store = new SqliteShadowStore(":memory:");
    store.enroll("shadowed");
    const wrapped = new ShadowAgentInvoker(inner, store);
    const r = await wrapped.invoke({
      agent: "shadowed",
      correlationId: "c1",
      dryRun: false, // caller asked for live...
      repo: fakeRepo,
    });
    // ...but the shadow agent was forced into dry-run.
    expect((r.output as any).shadowMode).toBe(true);
    expect((r.output as any).projection.sawDryRun).toBe(true);
    // A shadow agent observes; it does not change state.
    expect(r.emittedEvent).toBeUndefined();
    // The invocation is now a row of evidence.
    expect(store.evidence("shadowed").totalRuns).toBe(1);
  });
});

describe("promotion gate evaluation", () => {
  it("reports auto requirements as unmet when evidence is thin", () => {
    store = new SqliteShadowStore(":memory:");
    store.enroll("a");
    const ev = store.evidence("a"); // 0 runs, 0 days
    const result = evaluatePromotion(ev, POLICY);
    expect(result.autoMet).toBe(false);
    expect(result.unmetAuto).toContain("successfulSyncVerificationInvocations");
    expect(result.unmetAuto).toContain("shadowModeDays");
    expect(result.manualGates).toEqual(["acceptedADR", "manifestUpdate"]);
  });

  it("reports the automated gate as met when the evidence clears every threshold", () => {
    const ev = {
      agent: "a",
      enrolledAt: "2026-01-01T00:00:00Z",
      status: "shadow" as const,
      shadowDays: 30,
      totalRuns: 40,
      observedRuns: 40,
      matchedRuns: 39,
      agreementRate: 0.975,
      distinctTraces: 40,
    };
    const result = evaluatePromotion(ev, POLICY);
    expect(result.autoMet).toBe(true);
    expect(result.unmetAuto).toEqual([]);
    // manual gates are still surfaced — the ADR clears them
    expect(result.manualGates).toEqual(["acceptedADR", "manifestUpdate"]);
  });
});

describe("automated ADR proposal", () => {
  it("finds the next sequential ADR number from docs/adr", async () => {
    const n = await nextAdrNumber(repoRoot);
    expect(n).toMatch(/^\d{4}$/);
    expect(Number(n)).toBeGreaterThanOrEqual(5); // seed ships ADRs 0001-0004
  });

  it("generates a Proposed ADR citing the reliability evidence", () => {
    const evidence = {
      agent: "cash-forecaster",
      enrolledAt: "2026-01-01T00:00:00Z",
      status: "shadow" as const,
      shadowDays: 30,
      totalRuns: 40,
      observedRuns: 40,
      matchedRuns: 39,
      agreementRate: 0.975,
      distinctTraces: 40,
    };
    const evaluation = evaluatePromotion(evidence, POLICY);
    const proposal = generateAdrProposal({
      agent: "cash-forecaster",
      agentModule: "company/domains/finance-ops/finance",
      evidence,
      evaluation,
      number: "0005",
      today: "2026-05-14",
    });
    expect(proposal.file).toBe("docs/adr/0005-promote-cash-forecaster-to-autonomous.md");
    expect(proposal.content).toContain("# ADR 0005: Promote cash-forecaster to autonomous");
    expect(proposal.content).toContain("**Status:** Proposed");
    expect(proposal.content).toContain("97.5%"); // agreement rate
    expect(proposal.content).toContain("Automated gate: MET");
  });
});
