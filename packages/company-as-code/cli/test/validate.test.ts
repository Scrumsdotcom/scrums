import { describe, expect, it } from "vitest";
import { buildAjv, crossDocumentChecks, schemaValidate } from "../src/validate.js";
import { loadSchemas, type RepoCorpus } from "../src/loader.js";

function emptyCorpus(): RepoCorpus {
  return {
    manifests: [],
    agents: [],
    workflows: [],
    tasks: [],
    initiatives: [],
    goals: [],
    metrics: [],
    interfaces: [],
    organizations: [],
    persons: [],
    integrations: [],
    skills: [],
    dashboards: [],
    automations: [],
    eventTypeRegistries: [],
    autonomyPolicies: [],
    escalationPolicies: [],
  };
}

describe("crossDocumentChecks", () => {
  it("rejects hitl=true workflows with trigger.kind=schedule", () => {
    const corpus = emptyCorpus();
    corpus.workflows.push({
      file: "company/test/workflows/bad.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Workflow",
        name: "bad",
        module: "company/test",
        purpose: "intentionally broken",
        hitl: true,
        trigger: { kind: "schedule", schedule: "0 9 * * *" },
        steps: [{ id: "noop", kind: "wait" }],
      },
    });
    const errors = crossDocumentChecks(corpus);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/hitl: true with trigger.kind=schedule/);
  });

  it("rejects escalated agents missing the escalation block", () => {
    const corpus = emptyCorpus();
    corpus.agents.push({
      file: "company/test/agents/bad.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Agent",
        name: "bad",
        module: "company/test",
        purpose: "intentionally broken agent",
        cadence: "hourly",
        autonomy: "escalated",
        // missing escalation
      },
    });
    const errors = crossDocumentChecks(corpus);
    // The agent fixture has no parent manifest, so the manifest-linkage
    // check will also fire — we only assert that the escalation message
    // is among the errors raised.
    expect(errors.some((e) => /autonomy=escalated requires an escalation block/.test(e))).toBe(true);
  });

  it("rejects initiatives referencing undefined goals", () => {
    const corpus = emptyCorpus();
    corpus.initiatives.push({
      file: "company/initiatives/INIT-X.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Initiative",
        id: "INIT-X-0001",
        title: "Test",
        status: "active",
        owner: { kind: "team", id: "team:test" },
        startDate: "2026-01-01",
        goals: ["GOAL-DOES-NOT-EXIST"],
      },
    });
    const errors = crossDocumentChecks(corpus);
    expect(errors.some((e) => e.includes("GOAL-DOES-NOT-EXIST"))).toBe(true);
  });

  it("rejects goals referencing undefined metrics", () => {
    const corpus = emptyCorpus();
    corpus.goals.push({
      file: "company/goals/GOAL-X.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Goal",
        id: "GOAL-X-0001",
        title: "Test",
        type: "kpi",
        owner: { kind: "team", id: "team:test" },
        metric: "METRIC-MISSING",
        target: { value: 1, comparator: "gte" },
      },
    });
    const errors = crossDocumentChecks(corpus);
    expect(errors.some((e) => e.includes("METRIC-MISSING"))).toBe(true);
  });

  it("returns no errors on a clean corpus", () => {
    expect(crossDocumentChecks(emptyCorpus())).toEqual([]);
  });

  it("rejects an agent.skills entry that does not resolve", () => {
    const corpus = emptyCorpus();
    corpus.agents.push({
      file: "company/test/agents/dangling-skill.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Agent",
        name: "dangling-skill",
        module: "company/test",
        purpose: "intentionally references an undefined skill",
        cadence: "hourly",
        autonomy: "autonomous",
        skills: ["does-not-exist"],
      },
    });
    const errors = crossDocumentChecks(corpus);
    expect(errors.some((e) => e.includes("does-not-exist"))).toBe(true);
  });

  it("rejects a skill referencing a relatedSkill that does not resolve", () => {
    const corpus = emptyCorpus();
    corpus.skills.push({
      file: "company/skills/lonely.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Skill",
        name: "lonely",
        description: "Test skill with a dangling relatedSkills entry.",
        body: "# Lonely\n\nBody body body.",
        relatedSkills: ["ghost-skill"],
      },
    });
    const errors = crossDocumentChecks(corpus);
    expect(errors.some((e) => e.includes("ghost-skill"))).toBe(true);
  });
});

describe("schemaValidate", () => {
  it("rejects an agent missing a required field", async () => {
    const schemas = await loadSchemas();
    const ajv = buildAjv(schemas);
    const corpus = emptyCorpus();
    corpus.agents.push({
      file: "company/test/agents/missing-purpose.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Agent",
        name: "no-purpose",
        module: "company/test",
        // purpose intentionally omitted
        cadence: "hourly",
        autonomy: "autonomous",
      },
    });
    const problems = schemaValidate(corpus, ajv);
    expect(problems).toHaveLength(1);
    expect(problems[0].file).toBe("company/test/agents/missing-purpose.yaml");
    expect(problems[0].errors.some((e) => e.includes("purpose"))).toBe(true);
  });

  it("rejects an integration with an invalid mutationDirection enum", async () => {
    const schemas = await loadSchemas();
    const ajv = buildAjv(schemas);
    const corpus = emptyCorpus();
    corpus.integrations.push({
      file: "company/integrations/bad.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Integration",
        name: "bad",
        category: "crm",
        status: "active",
        ownerModule: "company/test",
        mutationDirection: "sometimes", // not in enum
      },
    });
    const problems = schemaValidate(corpus, ajv);
    expect(problems).toHaveLength(1);
    expect(problems[0].errors.some((e) => e.includes("mutationDirection"))).toBe(true);
  });

  it("rejects a Skill missing a required body", async () => {
    const schemas = await loadSchemas();
    const ajv = buildAjv(schemas);
    const corpus = emptyCorpus();
    corpus.skills.push({
      file: "company/skills/no-body.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Skill",
        name: "no-body",
        description: "Has no body. This should fail.",
        // body intentionally omitted
      },
    });
    const problems = schemaValidate(corpus, ajv);
    expect(problems).toHaveLength(1);
    expect(problems[0].errors.some((e) => e.includes("body"))).toBe(true);
  });

  it("accepts a minimal valid Skill", async () => {
    const schemas = await loadSchemas();
    const ajv = buildAjv(schemas);
    const corpus = emptyCorpus();
    corpus.skills.push({
      file: "company/skills/minimal.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Skill",
        name: "minimal",
        description: "A minimal valid skill.",
        body: "# Minimal\n\nThis is the body.",
      },
    });
    const problems = schemaValidate(corpus, ajv);
    expect(problems).toEqual([]);
  });

  it("rejects a Dashboard missing audience", async () => {
    const schemas = await loadSchemas();
    const ajv = buildAjv(schemas);
    const corpus = emptyCorpus();
    corpus.dashboards.push({
      file: "company/dashboards/no-audience.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Dashboard",
        name: "no-audience",
        owner: { module: "company/test" },
        purpose: "Test dashboard missing audience",
        refresh: "hourly",
        panels: [{ id: "p1", title: "P1", type: "stat", metric: "x" }],
      },
    });
    const problems = schemaValidate(corpus, ajv);
    expect(problems).toHaveLength(1);
    expect(problems[0].errors.some((e) => e.includes("audience"))).toBe(true);
  });

  it("rejects an Automation missing observability.auditTopic", async () => {
    const schemas = await loadSchemas();
    const ajv = buildAjv(schemas);
    const corpus = emptyCorpus();
    corpus.automations.push({
      file: "company/automations/no-audit.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Automation",
        name: "no-audit",
        owner: { module: "company/test" },
        purpose: "Test automation missing audit topic",
        cadence: "on-demand",
        inputs: [{ name: "dryRun", type: "boolean" }],
        invariants: ["Refuses without dry-run prerequisite."],
        observability: {},
      },
    });
    const problems = schemaValidate(corpus, ajv);
    expect(problems).toHaveLength(1);
    expect(problems[0].errors.some((e) => e.includes("auditTopic"))).toBe(true);
  });

  it("rejects an Automation that mutates state without a dryRun input", () => {
    const corpus = emptyCorpus();
    corpus.automations.push({
      file: "company/automations/bad.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Automation",
        name: "bad",
        owner: { module: "company/test" },
        purpose: "Mutates state but no dryRun input",
        cadence: "on-demand",
        inputs: [{ name: "period", type: "month" }],
        mutates: [{ canonical_table: "append-only" }],
        invariants: ["Always writes an audit record."],
        observability: { auditTopic: "bad" },
      },
    });
    const errors = crossDocumentChecks(corpus);
    expect(errors.some((e) => e.includes("does not declare a 'dryRun' input"))).toBe(true);
  });

  it("rejects an EventTypeRegistry with a malformed type name", async () => {
    const schemas = await loadSchemas();
    const ajv = buildAjv(schemas);
    const corpus = emptyCorpus();
    corpus.eventTypeRegistries.push({
      file: "company/events/event-types.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "EventTypeRegistry",
        version: 1,
        events: [
          {
            type: "BAD_TYPE_NAME",
            description: "Test malformed type",
            emittingModule: "company/test",
            status: "experimental",
          },
        ],
      },
    });
    const problems = schemaValidate(corpus, ajv);
    expect(problems).toHaveLength(1);
    expect(problems[0].errors.some((e) => e.includes("/events/0/type"))).toBe(true);
  });

  it("rejects a workflow emitting an event not in the registry", () => {
    const corpus = emptyCorpus();
    corpus.eventTypeRegistries.push({
      file: "company/events/event-types.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "EventTypeRegistry",
        version: 1,
        events: [
          {
            type: "finance.period_closed",
            description: "Period closed",
            emittingModule: "company/finance",
            status: "stable",
          },
        ],
      },
    });
    corpus.workflows.push({
      file: "company/workflows/test.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Workflow",
        name: "test",
        module: "company/test",
        purpose: "Emits an event not in the registry",
        trigger: { kind: "human" },
        steps: [
          { id: "go", kind: "emit-event", emitsEvent: "made.up.event_name" },
        ],
      },
    });
    const errors = crossDocumentChecks(corpus);
    expect(errors.some((e) => e.includes("made.up.event_name"))).toBe(true);
  });

  it("rejects multiple AutonomyPolicy documents (singleton)", () => {
    const corpus = emptyCorpus();
    for (const file of ["company/runtime/a.yaml", "company/runtime/b.yaml"]) {
      corpus.autonomyPolicies.push({
        file,
        data: {
          apiVersion: "company-as-code/v1",
          kind: "AutonomyPolicy",
          version: 1,
          classes: {
            autonomous: { description: "Read-only.", schedulingAllowed: true, requiresHumanApproval: false },
            "human-gated": { description: "HITL.", schedulingAllowed: false, requiresHumanApproval: true },
            escalated: { description: "Escalates.", schedulingAllowed: true, requiresHumanApproval: false },
          },
        },
      });
    }
    const errors = crossDocumentChecks(corpus);
    expect(errors.some((e) => e.includes("Multiple AutonomyPolicy"))).toBe(true);
  });

  it("rejects an EscalationPolicy missing required severities", async () => {
    const schemas = await loadSchemas();
    const ajv = buildAjv(schemas);
    const corpus = emptyCorpus();
    corpus.escalationPolicies.push({
      file: "company/runtime/escalation-policy.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "EscalationPolicy",
        version: 1,
        severities: {
          "sev-1": {
            description: "Critical.",
            acknowledgeWithin: "PT5M",
            pageMode: "continuous-until-ack",
          },
        },
        roles: [{ role: "on-call", description: "Primary on-call." }],
        channels: [{ kind: "page", target: "integrations/paging", forSeverities: ["sev-1"] }],
      },
    });
    const problems = schemaValidate(corpus, ajv);
    expect(problems).toHaveLength(1);
    expect(problems[0].errors.some((e) => e.includes("sev-2"))).toBe(true);
  });

  it("accepts a minimal valid Manifest", async () => {
    const schemas = await loadSchemas();
    const ajv = buildAjv(schemas);
    const corpus = emptyCorpus();
    corpus.manifests.push({
      file: "company/test/manifest.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Manifest",
        name: "test",
        domain: "finance-ops",
        lifecycle: "planning",
        owns: {},
        contacts: [{ role: "accountable" }],
      },
    });
    const problems = schemaValidate(corpus, ajv);
    expect(problems).toEqual([]);
  });
});
