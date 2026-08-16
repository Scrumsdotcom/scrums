// Generated from /schemas/automation.schema.json, do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** Deterministic execution unit between the agent layer and the integration layer. Every automation supports dryRun, declares its mutation surface, and lists known failure modes. */
export interface Automation {
  apiVersion: "company-as-code/v1";
  kind: "Automation";
  name: string;
  owner: {
    module: string;
    person?: string;
  };
  purpose: string;
  /** Abstract runtime label (scheduled-job, event-handler, webhook). No vendor names. */
  runtime?: string;
  /** cron expression or 'on-demand'. */
  schedule?: string;
  cadence: "realtime" | "minutely" | "hourly" | "daily" | "weekly" | "monthly" | "on-demand" | "event-driven";
  /** Typed inputs. A `dryRun: boolean` input is required by convention; the cross-document validator enforces. */
  inputs: Array<{
    name: string;
    type: string;
    required?: boolean;
    description?: string;
  }>;
  outputs?: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
  /** Canonical tables or integrations this automation writes to. Empty array means read-only. */
  mutates?: Array<Record<string, unknown>>;
  invariants: Array<string>;
  failureModes?: Array<{
    description: string;
    behavior: string;
  }>;
  observability?: {
    auditTopic: string;
    dashboards?: Array<string>;
    alerts?: Array<string>;
  };
}
