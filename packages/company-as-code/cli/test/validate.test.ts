import { describe, expect, it } from "vitest";
import { buildAjv, crossDocumentChecks, schemaValidate } from "../src/validate.js";
import { emptyCorpus, loadSchemas } from "../src/loader.js";
import { danglingReferenceErrors, resolveTypedEdges } from "../src/refs.js";


describe("crossDocumentChecks", () => {
  it("rejects hitl=true workflows with trigger.kind=schedule", () => {
    const corpus = emptyCorpus();
    corpus.workflows.push({
      file: "company/test/workflows/bad.yaml",
      data: {
        apiVersion: "company-as-code/v1alpha1",
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
        apiVersion: "company-as-code/v1alpha1",
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
    // check will also fire, we only assert that the escalation message
    // is among the errors raised.
    expect(errors.some((e) => /autonomy=escalated requires an escalation block/.test(e))).toBe(true);
  });

  it("returns no errors on a clean corpus", () => {
    expect(crossDocumentChecks(emptyCorpus())).toEqual([]);
  });

  it("rejects a capability chain that repeats its own primary owner", () => {
    const corpus = emptyCorpus();
    corpus.capabilities.push({
      file: "company/capabilities/CAP-X.yaml",
      data: {
        apiVersion: "company-as-code/v1alpha1",
        kind: "Capability",
        id: "CAP-X",
        name: "x",
        description: "a capability whose fallback is its own primary owner",
        criticality: "high",
        primaryOwner: { kind: "role", id: "platform-lead", delivers: "full" },
        fallback: [{ kind: "role", id: "platform-lead", delivers: "full" }],
        finalFallback: { kind: "person", id: "cto", delivers: "full" },
      },
    });
    const errors = crossDocumentChecks(corpus);
    expect(errors.some((e) => /appears twice in the ownership chain/.test(e))).toBe(true);
  });

  it("rejects a capability chain that terminates in an agent", () => {
    const corpus = emptyCorpus();
    corpus.capabilities.push({
      file: "company/capabilities/CAP-Y.yaml",
      data: {
        apiVersion: "company-as-code/v1alpha1",
        kind: "Capability",
        id: "CAP-Y",
        name: "y",
        description: "a capability whose last link can itself be absent",
        criticality: "medium",
        primaryOwner: { kind: "role", id: "platform-lead", delivers: "full" },
        finalFallback: { kind: "agent", id: "some-agent", delivers: "full" },
      },
    });
    const errors = crossDocumentChecks(corpus);
    expect(errors.some((e) => /finalFallback is an agent/.test(e))).toBe(true);
  });

  it("rejects an in-scope requirement that no control implements", () => {
    const corpus = emptyCorpus();
    corpus.requirements.push({
      file: "company/requirements/REQ-X.yaml",
      data: {
        apiVersion: "company-as-code/v1alpha1",
        kind: "Requirement",
        id: "REQ-X",
        framework: "internal",
        clause: "X-1",
        title: "Uncovered obligation",
        statement: "An obligation that nothing in the repository implements.",
        owner: { kind: "person", id: "cto" },
        status: "in-scope",
      },
    });
    const errors = crossDocumentChecks(corpus);
    expect(errors.some((e) => /no Control declares it under 'implements'/.test(e))).toBe(true);
  });

  it("rejects a proposal whose status outran its ruling", () => {
    const corpus = emptyCorpus();
    corpus.proposals.push({
      file: "company/proposals/PROP-9999.yaml",
      data: {
        apiVersion: "company-as-code/v1alpha1",
        kind: "Proposal",
        id: "PROP-9999",
        title: "Applied on a rejection",
        status: "applied",
        author: { kind: "person", id: "ceo" },
        targets: [{ path: "docs/spec/company-as-code-spec.md", surface: "spec" }],
        reason: "Reason long enough to satisfy the schema.",
        benefit: "A benefit.",
        validation: "How we check.",
        rollback: "How we undo.",
        ruling: {
          decision: "rejected",
          actor: { kind: "person", id: "ceo" },
          date: "2026-08-16",
          verbatim: "No.",
        },
      },
    });
    const errors = crossDocumentChecks(corpus);
    expect(errors.some((e) => /does not agree with ruling.decision/.test(e))).toBe(true);
  });
});

describe("typed references", () => {
  it("reports an initiative pointing at a goal that does not exist", async () => {
    const corpus = emptyCorpus();
    corpus.initiatives.push({
      file: "company/initiatives/INIT-X.yaml",
      data: {
        apiVersion: "company-as-code/v1alpha1",
        kind: "Initiative",
        id: "INIT-X-0001",
        title: "Test",
        status: "active",
        owner: { kind: "team", id: "team:test" },
        startDate: "2026-01-01",
        goals: ["GOAL-DOES-NOT-EXIST"],
      },
    });
    const errors = danglingReferenceErrors(resolveTypedEdges(corpus, await loadSchemas()));
    expect(errors.some((e) => e.includes("GOAL-DOES-NOT-EXIST"))).toBe(true);
  });

  it("reports a goal pointing at a metric that does not exist", async () => {
    const corpus = emptyCorpus();
    corpus.goals.push({
      file: "company/goals/GOAL-X.yaml",
      data: {
        apiVersion: "company-as-code/v1alpha1",
        kind: "Goal",
        id: "GOAL-X-0001",
        title: "Test",
        type: "kpi",
        owner: { kind: "team", id: "team:test" },
        metric: "METRIC-MISSING",
        target: { value: 1, comparator: "gte" },
      },
    });
    const errors = danglingReferenceErrors(resolveTypedEdges(corpus, await loadSchemas()));
    expect(errors.some((e) => e.includes("METRIC-MISSING"))).toBe(true);
  });

  it("reports an agent skill reference that does not resolve", async () => {
    const corpus = emptyCorpus();
    corpus.agents.push({
      file: "company/test/agents/dangling-skill.yaml",
      data: {
        apiVersion: "company-as-code/v1alpha1",
        kind: "Agent",
        name: "dangling-skill",
        module: "company/test",
        purpose: "intentionally references an undefined skill",
        cadence: "hourly",
        autonomy: "autonomous",
        skills: ["does-not-exist"],
      },
    });
    const errors = danglingReferenceErrors(resolveTypedEdges(corpus, await loadSchemas()));
    expect(errors.some((e) => e.includes("does-not-exist"))).toBe(true);
  });

  it("reports a relatedSkills entry that does not resolve", async () => {
    const corpus = emptyCorpus();
    corpus.skills.push({
      file: "company/skills/lonely.yaml",
      data: {
        apiVersion: "company-as-code/v1alpha1",
        kind: "Skill",
        name: "lonely",
        description: "Test skill with a dangling relatedSkills entry.",
        body: "# Lonely\n\nBody body body.",
        relatedSkills: ["ghost-skill"],
      },
    });
    const errors = danglingReferenceErrors(resolveTypedEdges(corpus, await loadSchemas()));
    expect(errors.some((e) => e.includes("ghost-skill"))).toBe(true);
  });

  it("resolves a reference once the target exists", async () => {
    const corpus = emptyCorpus();
    corpus.metrics.push({
      file: "company/metrics/METRIC-REAL.yaml",
      data: { apiVersion: "company-as-code/v1alpha1", kind: "Metric", id: "METRIC-REAL", name: "Real" },
    });
    corpus.goals.push({
      file: "company/goals/GOAL-X.yaml",
      data: {
        apiVersion: "company-as-code/v1alpha1",
        kind: "Goal",
        id: "GOAL-X-0001",
        title: "Test",
        type: "kpi",
        owner: { kind: "team", id: "team:test" },
        metric: "METRIC-REAL",
        target: { value: 1, comparator: "gte" },
      },
    });
    const edges = resolveTypedEdges(corpus, await loadSchemas());
    expect(danglingReferenceErrors(edges)).toEqual([]);
    expect(edges.some((e) => e.toId === "METRIC-REAL" && e.toKind === "Metric")).toBe(true);
  });

  it("the inventory of typed reference edges is exactly what is declared", async () => {
    // An explicit inventory rather than a heuristic. Adding a reference field
    // without annotating it, or annotating one that should not be an edge,
    // both fail here, which is the point: the edge set is a design decision,
    // not something that drifts in unnoticed.
    const expected = [
      "agent.schema.json:module -> Manifest",
      "agent.schema.json:observability.dashboards[] -> Dashboard",
      "agent.schema.json:skills[] -> Skill",
      "capability.schema.json:measuredBy[] -> Metric",
      "capability.schema.json:requires[] -> Capability",
      "control.schema.json:appliesTo[] -> Manifest",
      "control.schema.json:compensatingFor[] -> Control",
      "control.schema.json:implements[] -> Requirement",
      "dashboard.schema.json:owner.module -> Manifest",
      "goal.schema.json:metric -> Metric",
      "initiative.schema.json:goals[] -> Goal",
      "initiative.schema.json:metrics[] -> Metric",
      "integration.schema.json:ownerModule -> Manifest",
      "manifest.schema.json:consumes[].from -> Manifest",
      "metric.schema.json:dashboards[] -> Dashboard",
      "metric.schema.json:owner.module -> Manifest",
      "organization.schema.json:module -> Manifest",
      "organization.schema.json:parent -> Organization",
      "person.schema.json:organizations[] -> Organization",
      "proposal.schema.json:supersededBy -> Proposal",
      "proposal.schema.json:supersedes[] -> Proposal",
      "requirement.schema.json:appliesTo[] -> Manifest",
      "skill.schema.json:relatedSkills[] -> Skill",
      "task.schema.json:automation.agent -> Agent",
      "task.schema.json:automation.workflow -> Workflow",
      "task.schema.json:module -> Manifest",
      "workflow.schema.json:module -> Manifest",
      "workflow.schema.json:observability.dashboards[] -> Dashboard",
      "workflow.schema.json:observability.metrics[] -> Metric",
      "workflow.schema.json:steps[].agent -> Agent",
      "workflow.schema.json:steps[].automation -> Automation",
    ];

    const found: string[] = [];
    const schemas = await loadSchemas();
    for (const [file, schema] of Object.entries(schemas)) {
      walk(schema as Record<string, unknown>, file, "");
    }
    expect(found.sort()).toEqual(expected);

    function walk(node: Record<string, unknown>, file: string, at: string): void {
      if (!node || typeof node !== "object") return;
      const ref = node["x-cac-ref"];
      if (Array.isArray(ref) && at) found.push(`${file}:${at} -> ${ref.join("|")}`);
      const props = node.properties as Record<string, Record<string, unknown>> | undefined;
      if (props) {
        for (const [key, child] of Object.entries(props)) {
          walk(child, file, at ? `${at}.${key}` : key);
        }
      }
      const items = node.items as Record<string, unknown> | undefined;
      if (items) walk(items, file, `${at}[]`);
      const defs = node.$defs as Record<string, Record<string, unknown>> | undefined;
      if (defs) for (const d of Object.values(defs)) walk(d, file, at);
    }
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
        apiVersion: "company-as-code/v1alpha1",
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
        apiVersion: "company-as-code/v1alpha1",
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
        apiVersion: "company-as-code/v1alpha1",
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
        apiVersion: "company-as-code/v1alpha1",
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
        apiVersion: "company-as-code/v1alpha1",
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
        apiVersion: "company-as-code/v1alpha1",
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
        apiVersion: "company-as-code/v1alpha1",
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
        apiVersion: "company-as-code/v1alpha1",
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
        apiVersion: "company-as-code/v1alpha1",
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
        apiVersion: "company-as-code/v1alpha1",
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
          apiVersion: "company-as-code/v1alpha1",
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
        apiVersion: "company-as-code/v1alpha1",
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
        apiVersion: "company-as-code/v1alpha1",
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
