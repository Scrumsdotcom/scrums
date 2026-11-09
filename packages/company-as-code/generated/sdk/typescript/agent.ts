// Generated from /schemas/agent.schema.json, do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** Autonomous execution unit. Declared in a module manifest and elaborated in /agents/<name>.yaml. */
export interface Agent {
  apiVersion: "company-as-code/v1alpha1";
  kind: "Agent";
  name: string;
  /** Owning module path (must match the agent's declaration in that module's manifest). */
  module: string;
  purpose: string;
  /** Abstract runtime label (e.g. 'llm', 'scheduled-job', 'event-handler'). No vendor names. */
  runtime?: string;
  /** cron expression or the literal string 'on-demand'. */
  schedule?: string;
  cadence: "realtime" | "minutely" | "hourly" | "daily" | "weekly" | "monthly" | "on-demand" | "event-driven";
  autonomy: "autonomous" | "human-gated" | "escalated";
  /** Required when autonomy is 'escalated'. */
  escalation?: {
    threshold?: string;
    to?: string;
  };
  inputs?: Array<{
    name: string;
    type: string;
    /** Source interface or canonical entity. */
    from?: string;
  }>;
  outputs?: Array<{
    name: string;
    type: string;
    emitsEvent?: string;
  }>;
  /** Named tools / capabilities scoped to this agent. */
  tools?: Array<string>;
  /** Tier-3 skills (by name) this agent is authorized to invoke. See /company/skills. */
  skills?: Array<string>;
  /** Pointer into /company/memory namespace this agent reads/writes. */
  memoryScope?: string;
  observability?: {
    dashboards?: Array<string>;
    alerts?: Array<string>;
    auditTopic?: string;
  };
  invariants?: Array<string>;
  primaryUsers?: Array<string>;
  contacts?: Array<{
    role: string;
    person?: string;
  }>;
}
