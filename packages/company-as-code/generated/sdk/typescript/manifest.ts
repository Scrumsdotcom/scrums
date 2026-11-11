// Generated from /schemas/manifest.schema.json, do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** Declarative source of truth for a module. Every module at every level of the organizational graph has a manifest.yaml at its root. */
export interface ModuleManifest {
  /** Schema contract version. */
  apiVersion: "company-as-code/v1alpha1";
  kind: "Manifest";
  /** Kebab-case module identifier, unique within the parent domain. */
  name: string;
  /** Canonical domain this module belongs to. */
  domain: "executive" | "finance-ops" | "product-operations" | "sales-marketing" | "framework";
  /** Optional parent module path (e.g. domains/product-operations/platform). */
  parent?: string;
  /** Semantic version of the module manifest. */
  version?: string;
  /** Module lifecycle stage. */
  lifecycle: "planning" | "hardening" | "stable" | "agent-ready" | "deprecated";
  /** One-sentence purpose statement for the module. */
  purpose?: string;
  /** What this module is canonically responsible for. */
  owns: {
    tables?: Array<string>;
    agents?: Array<string>;
    apps?: Array<string>;
    workflows?: Array<string>;
    dashboards?: Array<string>;
    schemas?: Array<string>;
    policies?: Array<string>;
    playbooks?: Array<string>;
  };
  /** Named interfaces this module reads from other modules. */
  consumes?: Array<{
    interface: string;
    /** Source module path. */
    from: string;
    usage?: string;
  }>;
  /** Named interfaces this module offers to others. */
  exposes?: Array<{
    interface: string;
    stability: "experimental" | "stable" | "deprecated";
    description?: string;
  }>;
  /** Autonomous units declared by this module. */
  agents?: Array<{
    name: string;
    purpose: string;
    runtime?: string;
    /** cron expression or 'on-demand'. */
    schedule?: string;
    cadence: "realtime" | "minutely" | "hourly" | "daily" | "weekly" | "monthly" | "on-demand" | "event-driven";
    autonomy: "autonomous" | "human-gated" | "escalated";
    primaryUsers?: Array<string>;
    outputs?: Array<string>;
  }>;
  /** Declarative properties that must remain true. */
  invariants?: Array<string>;
  /** Humans accountable for this module. */
  contacts: Array<{
    role: string;
    person?: string;
    team?: string;
  }>;
  /** References to runbooks, dashboards, plans. */
  links?: Record<string, string>;
}
