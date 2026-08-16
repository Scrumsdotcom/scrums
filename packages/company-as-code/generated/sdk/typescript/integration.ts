// Generated from /schemas/integration.schema.json, do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** Mapping between the coordination layer and an external system. No vendor names are canonical; integrations are pluggable. */
export interface Integration {
  apiVersion: "company-as-code/v1";
  kind: "Integration";
  /** Local canonical name for the integration. The vendor name lives in 'system', not here. */
  name: string;
  /** Vendor / system identifier. Optional, the framework treats integrations as replaceable. */
  system?: string;
  category: "crm" | "workflow-engine" | "database" | "project-management" | "cloud" | "orchestration" | "ai-provider" | "communication" | "observability" | "billing" | "identity" | "storage" | "search" | "analytics" | "other";
  status: "planned" | "configured" | "active" | "degraded" | "deprecated" | "removed";
  /** Module accountable for this integration. */
  ownerModule: string;
  /** Direction of state flow between this integration and the coordination layer. */
  mutationDirection: "read-only" | "write-only" | "read-write" | "writeback-only";
  /** Which canonical entities this integration maps to which external IDs. */
  canonicalIdMapping?: Array<{
    /** Canonical entity kind, e.g. 'customer', 'person'. */
    entity: string;
    externalIdField: string;
    notes?: string;
  }>;
  auth?: {
    kind?: "api-key" | "oauth" | "service-account" | "webhook-signature" | "mtls";
    /** Pointer into the secret manager. Never a literal secret. */
    secretRef?: string;
    rotationPolicy?: string;
  };
  endpoints?: Array<{
    name: string;
    url: string;
    method?: string;
  }>;
  /** Operations against this integration that require human-in-the-loop confirmation. */
  hitlRequiredFor?: Array<string>;
  rateLimits?: {
    requestsPerMinute?: number;
    burst?: number;
  };
  observability?: {
    dashboards?: Array<string>;
    alerts?: Array<string>;
  };
}
