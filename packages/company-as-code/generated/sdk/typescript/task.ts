// Generated from /schemas/task.schema.json — do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** Canonical unit of execution. Tasks are state machines with typed transitions. */
export interface Task {
  apiVersion: "company-as-code/v1";
  kind: "Task";
  /** Canonical task ID, e.g. TASK-FIN-0042. Module prefix is opaque. */
  id: string;
  title: string;
  description?: string;
  /** Owning module path. */
  module?: string;
  state: "backlog" | "planned" | "active" | "blocked" | "review" | "completed" | "archived" | "failed";
  owner: {
    kind: "person" | "agent" | "team";
    id: string;
  };
  priority?: "p0" | "p1" | "p2" | "p3";
  dueAt?: string;
  sla?: {
    /** ISO 8601 duration. */
    respondWithin?: string;
    /** ISO 8601 duration. */
    resolveWithin?: string;
  };
  dependencies?: Array<string>;
  subtasks?: Array<string>;
  escalation?: {
    /** ISO 8601 duration before escalation. */
    after?: string;
    to?: string;
  };
  automation?: {
    workflow?: string;
    agent?: string;
    trigger?: string;
  };
  approvals?: Array<{
    role: string;
    actor?: string;
    decidedAt?: string;
    decision?: "approved" | "rejected" | "pending";
  }>;
  labels?: Array<string>;
  createdAt?: string;
  updatedAt?: string;
  history?: Array<{
    state: string;
    at: string;
    actor?: string;
    note?: string;
  }>;
}
