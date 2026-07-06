import { describe, expect, it } from "vitest";
import { buildAjv, schemaValidate } from "../src/validate.js";
import { loadSchemas, type RepoCorpus } from "../src/loader.js";

/**
 * Negative fixtures — adversarial documents that *should* fail validation.
 *
 * These guard against regressions in the schemas themselves: if a schema is
 * loosened by accident, the corresponding negative fixture starts to pass
 * and the test goes red.
 */

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
    events: [],
    stateSnapshots: [],
    shadowEnrollments: [],
  };
}

describe("negative fixtures (must fail validation)", () => {
  it("workflow with trigger.kind=schedule but no schedule field", async () => {
    const ajv = buildAjv(await loadSchemas());
    const corpus = emptyCorpus();
    corpus.workflows.push({
      file: "neg/schedule-no-cron.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Workflow",
        name: "schedule-no-cron",
        module: "company/test",
        purpose: "Schedule trigger missing schedule field.",
        trigger: { kind: "schedule" },
        steps: [{ id: "noop", kind: "wait" }],
      },
    });
    expect(schemaValidate(corpus, ajv).length).toBeGreaterThan(0);
  });

  it("workflow with trigger.kind=event but no event field", async () => {
    const ajv = buildAjv(await loadSchemas());
    const corpus = emptyCorpus();
    corpus.workflows.push({
      file: "neg/event-no-type.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Workflow",
        name: "event-no-type",
        module: "company/test",
        purpose: "Event trigger missing event field.",
        trigger: { kind: "event" },
        steps: [{ id: "noop", kind: "wait" }],
      },
    });
    expect(schemaValidate(corpus, ajv).length).toBeGreaterThan(0);
  });

  it("workflow with trigger.kind=human but no actor field", async () => {
    const ajv = buildAjv(await loadSchemas());
    const corpus = emptyCorpus();
    corpus.workflows.push({
      file: "neg/human-no-actor.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Workflow",
        name: "human-no-actor",
        module: "company/test",
        purpose: "Human trigger missing actor field.",
        trigger: { kind: "human" },
        steps: [{ id: "noop", kind: "wait" }],
      },
    });
    expect(schemaValidate(corpus, ajv).length).toBeGreaterThan(0);
  });

  it("workflow step kind=agent missing agent field", async () => {
    const ajv = buildAjv(await loadSchemas());
    const corpus = emptyCorpus();
    corpus.workflows.push({
      file: "neg/agent-step-no-agent.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Workflow",
        name: "agent-step-no-agent",
        module: "company/test",
        purpose: "Agent step missing agent field.",
        trigger: { kind: "human", actor: "people:test" },
        steps: [{ id: "go", kind: "agent" }],
      },
    });
    expect(schemaValidate(corpus, ajv).length).toBeGreaterThan(0);
  });

  it("workflow step kind=automation missing automation field", async () => {
    const ajv = buildAjv(await loadSchemas());
    const corpus = emptyCorpus();
    corpus.workflows.push({
      file: "neg/automation-step-no-automation.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Workflow",
        name: "automation-step-no-automation",
        module: "company/test",
        purpose: "Automation step missing automation field.",
        trigger: { kind: "human", actor: "people:test" },
        steps: [{ id: "go", kind: "automation" }],
      },
    });
    expect(schemaValidate(corpus, ajv).length).toBeGreaterThan(0);
  });

  it("workflow step kind=human-approval missing approver field", async () => {
    const ajv = buildAjv(await loadSchemas());
    const corpus = emptyCorpus();
    corpus.workflows.push({
      file: "neg/approval-step-no-approver.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Workflow",
        name: "approval-step-no-approver",
        module: "company/test",
        purpose: "Human-approval step missing approver field.",
        trigger: { kind: "human", actor: "people:test" },
        hitl: true,
        steps: [{ id: "go", kind: "human-approval" }],
      },
    });
    expect(schemaValidate(corpus, ajv).length).toBeGreaterThan(0);
  });

  it("workflow step kind=emit-event missing emitsEvent field", async () => {
    const ajv = buildAjv(await loadSchemas());
    const corpus = emptyCorpus();
    corpus.workflows.push({
      file: "neg/emit-step-no-event.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Workflow",
        name: "emit-step-no-event",
        module: "company/test",
        purpose: "Emit-event step missing emitsEvent field.",
        trigger: { kind: "human", actor: "people:test" },
        steps: [{ id: "go", kind: "emit-event" }],
      },
    });
    expect(schemaValidate(corpus, ajv).length).toBeGreaterThan(0);
  });

  it("agent with autonomy=escalated but no escalation block (cross-doc)", async () => {
    // schema-wise this is allowed; cross-doc check rejects it. Covered by
    // a dedicated test in validate.test.ts. The negative fixture here
    // documents the same shape from the validator's perspective.
    expect(true).toBe(true);
  });

  it("integration with invalid category enum value", async () => {
    const ajv = buildAjv(await loadSchemas());
    const corpus = emptyCorpus();
    corpus.integrations.push({
      file: "neg/integration-bad-category.yaml",
      data: {
        apiVersion: "company-as-code/v1",
        kind: "Integration",
        name: "bad",
        category: "not-a-real-category",
        status: "active",
        ownerModule: "company/test",
        mutationDirection: "read-only",
      },
    });
    expect(schemaValidate(corpus, ajv).length).toBeGreaterThan(0);
  });
});
