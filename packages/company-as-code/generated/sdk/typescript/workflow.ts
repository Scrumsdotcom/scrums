// Generated from /schemas/workflow.schema.json, do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** Multi-step orchestration definition. May be triggered by event, schedule, or human action. */
export interface Workflow {
  apiVersion: "company-as-code/v1";
  kind: "Workflow";
  name: string;
  module: string;
  purpose: string;
  trigger: {
    kind: "event" | "schedule" | "human" | "webhook" | "manual";
    event?: string;
    schedule?: string;
    actor?: string;
  };
  inputs?: Array<{
    name: string;
    type: string;
    required?: boolean;
  }>;
  outputs?: Array<{
    name: string;
    type: string;
  }>;
  steps: Array<{
    id: string;
    kind: "agent" | "automation" | "human-approval" | "wait" | "branch" | "emit-event" | "external-call" | "dry-run" | "live-write";
    agent?: string;
    automation?: string;
    approver?: string;
    /** When the step writes to an external surface, require a dry-run predecessor. */
    dryRunRequired?: boolean;
    /** Step requires a human-in-the-loop confirmation. */
    hitl?: boolean;
    emitsEvent?: string;
    onFailure?: "retry" | "escalate" | "abort";
    retries?: number;
    /** ISO 8601 duration. */
    timeout?: string;
    branches?: Array<{
      when: string;
      next: string;
    }>;
  }>;
  invariants?: Array<string>;
  /** If true, the workflow as a whole is human-gated. Scheduled triggers fail validation when hitl is true. */
  hitl?: boolean;
  observability?: {
    dashboards?: Array<string>;
    metrics?: Array<string>;
  };
}
