// Generated from /schemas/initiative.schema.json, do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** Strategic change, time-bounded and decomposable. Initiatives roll up into goals and decompose into tasks. */
export interface Initiative {
  apiVersion: "company-as-code/v1";
  kind: "Initiative";
  id: string;
  title: string;
  summary?: string;
  status: "proposed" | "approved" | "active" | "paused" | "complete" | "abandoned";
  owner: {
    kind: "person" | "team" | "agent";
    id: string;
  };
  domain?: "executive" | "finance-ops" | "product-operations" | "sales-marketing" | "cross-domain";
  startDate: string;
  targetDate?: string;
  completedAt?: string;
  /** Goal IDs this initiative advances. */
  goals?: Array<string>;
  /** Metric IDs the initiative is measured against. */
  metrics?: Array<string>;
  tasks?: Array<string>;
  /** Modules that participate in delivery. */
  modules?: Array<string>;
  risks?: Array<{
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    mitigation?: string;
  }>;
  milestones?: Array<{
    name: string;
    date: string;
    achieved?: boolean;
  }>;
}
