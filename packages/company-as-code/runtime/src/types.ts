// Runtime-host types. Mirror the canonical schemas under /schemas; we keep
// them narrow TypeScript shapes here rather than importing JSON Schema
// validators so the executor can pass typed payloads around at compile time.
//
// The sinks accept loose JSON-shaped values for forward compatibility; the
// CLI validator at the dev edge ensures correctness before anything reaches
// the runtime.

export type AutonomyClass = "autonomous" | "human-gated" | "escalated";

export interface AuditRecord {
  apiVersion: "company-as-code/v1";
  kind: "AuditRecord";
  id: string;
  actor: { kind: "person" | "agent" | "automation" | "system"; id: string };
  action: string;
  module?: string;
  workflow?: string;
  agent?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  status: "success" | "failure" | "partial" | "dry-run" | "skipped";
  dryRun?: boolean;
  input?: unknown;
  output?: unknown;
  error?: { code?: string; message?: string; stack?: string };
  correlationId?: string;
  causationId?: string;
  targetSystem?: string;
}

export interface TypedEvent {
  apiVersion: "company-as-code/v1";
  kind: "Event";
  id: string;
  type: string;
  entity: { canonicalId: string; kind: string };
  occurredAt: string;
  recordedAt?: string;
  actor: { kind: "person" | "agent" | "automation" | "system"; id: string };
  payload?: Record<string, unknown>;
  from?: string;
  to?: string;
  correlationId?: string;
  causationId?: string;
  source?: { module?: string; workflow?: string; agent?: string };
  schemaVersion?: string;
}

export interface WorkflowStep {
  id: string;
  kind:
    | "agent"
    | "automation"
    | "human-approval"
    | "wait"
    | "branch"
    | "emit-event"
    | "external-call"
    | "dry-run"
    | "live-write";
  agent?: string;
  automation?: string;
  approver?: string;
  dryRunRequired?: boolean;
  hitl?: boolean;
  emitsEvent?: string;
  onFailure?: "retry" | "escalate" | "abort";
  retries?: number;
  timeout?: string;
  branches?: Array<{ when: string; next: string }>;
}

export interface WorkflowDoc {
  apiVersion: "company-as-code/v1";
  kind: "Workflow";
  name: string;
  module: string;
  purpose: string;
  trigger: { kind: "event" | "schedule" | "human" | "webhook" | "manual"; actor?: string; event?: string; schedule?: string };
  hitl?: boolean;
  inputs?: Array<{ name: string; type: string; required?: boolean }>;
  outputs?: Array<{ name: string; type: string }>;
  steps: WorkflowStep[];
  invariants?: string[];
  observability?: { dashboards?: string[]; metrics?: string[] };
}

export interface ExecutionContext {
  correlationId: string;
  workflowName: string;
  modulePath: string;
  startedAt: string;
  triggerActor: string;
  dryRun: boolean;
  inputs: Record<string, unknown>;
}

export interface StepResult {
  stepId: string;
  status: "success" | "failure" | "skipped" | "blocked";
  message?: string;
  emittedEvent?: string;
  output?: unknown;
}
