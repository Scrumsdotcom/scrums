// Generated from /schemas/organization.schema.json, do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** Canonical organizational unit, company, business unit, team, pod, department. Forms the executable org graph. */
export interface Organization {
  apiVersion: "company-as-code/v1alpha1";
  kind: "Organization";
  /** Permanent internal ID. Never changes for the lifetime of the entity. */
  canonicalId: string;
  name: string;
  type: "company" | "business-unit" | "department" | "team" | "pod" | "guild" | "circle";
  domain?: "executive" | "finance-ops" | "product-operations" | "sales-marketing" | "cross-domain";
  /** Canonical ID of parent organization. */
  parent?: string;
  /** Path to the module manifest representing this org unit in the cognition tree. */
  module?: string;
  status: "proposed" | "active" | "frozen" | "dissolved" | "merged";
  lifecycle?: {
    createdAt?: string;
    dissolvedAt?: string;
    mergedInto?: string;
  };
  members?: Array<string>;
  leads?: Array<string>;
  mission?: string;
  externalIds?: Array<{
    /** Canonical name of the external system. */
    system: string;
    id: string;
    addedAt?: string;
    rotatedAt?: string;
  }>;
}
