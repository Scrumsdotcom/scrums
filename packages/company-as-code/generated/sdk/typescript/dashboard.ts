// Generated from /schemas/dashboard.schema.json, do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** Read-only observability surface. Declares the metrics, audience, refresh cadence, and panel layout. Dashboards never trigger writes; control surfaces are workflows. */
export interface Dashboard {
  apiVersion: "company-as-code/v1alpha1";
  kind: "Dashboard";
  /** Kebab-case identifier, globally unique. */
  name: string;
  owner: {
    module: string;
    person?: string;
  };
  purpose: string;
  /** Role or canonical Person IDs that consume this dashboard. */
  audience: Array<string>;
  refresh: "realtime" | "minutely" | "hourly" | "daily" | "on-demand";
  panels: Array<{
    id: string;
    title: string;
    type: "stat" | "line" | "bar" | "percentage" | "counter" | "histogram" | "list" | "markdown" | "composite";
    /** Metric ID or interface-relative metric reference. */
    metric?: string;
    /** Alternative to metric: an event-stream path or interface reference. */
    source?: string;
    /** ISO 8601 duration when the panel shows a windowed view. */
    horizon?: string;
    annotation?: string;
    thresholds?: {
      warning?: {
        comparator: "gt" | "gte" | "lt" | "lte" | "eq" | "neq";
        value: number | string;
      };
      critical?: {
        comparator: "gt" | "gte" | "lt" | "lte" | "eq" | "neq";
        value: number | string;
      };
    };
    /** For composite panels: sub-panel IDs. */
    elements?: Array<string>;
  }>;
  alerts?: Array<{
    id: string;
    description: string;
    severity: "sev-1" | "sev-2" | "sev-3" | "sev-4";
    /** Role identifier resolved against escalation-policy.yaml. */
    routing: string;
  }>;
  invariants?: Array<string>;
}
