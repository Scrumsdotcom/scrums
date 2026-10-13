// Generated from /schemas/capability.schema.json, do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** One link in the ownership chain. `delivers` is the honest statement of how much of the capability this holder actually provides. */
export interface Holder {
  kind: "agent" | "person" | "team" | "module" | "role";
  id: string;
  /** 'full' means no loss. 'reduced' means a documented subset. 'manual' means the automation is gone but the outcome still happens. 'triage-only' means the holder can hold the line, not close the loop. */
  delivers: "full" | "reduced" | "manual" | "triage-only";
  note?: string;
}

/** Something the company must be able to do, with a declared chain of who does it. Every capability names a primary owner, an ordered fallback chain, and a final fallback that can never itself be absent. A company can lose people, agents, and whole modules without losing a capability: the chain says who picks it up and how much of it survives. */
export interface Capability {
  apiVersion: "company-as-code/v1alpha1";
  kind: "Capability";
  /** Canonical, permanent capability ID (e.g. CAP-MONTH-END-CLOSE). */
  id: string;
  name: string;
  description: string;
  domain?: "finance-ops" | "product-operations" | "sales-marketing" | "executive" | "cross-domain";
  /** How badly the company degrades if this capability is unavailable. 'high' and 'critical' require at least one intermediate fallback. */
  criticality: "low" | "medium" | "high" | "critical";
  primaryOwner: Holder;
  /** Ordered chain tried when the primary is absent, saturated, or stalled. First match wins. */
  fallback?: Array<Holder>;
  /** The holder that always answers. Typically a human role, because a chain that terminates in an agent can terminate in nothing. */
  finalFallback: Holder;
  /** The response commitment for the capability as a whole, e.g. 'first response within 4 business hours'. */
  sla?: string;
  /** Other capabilities this one depends on. Cycles are permitted (a company is a cyclic graph) but are reported by the capability map. */
  requires?: Array<string>;
  /** Metrics that show whether the capability is actually being delivered. */
  measuredBy?: Array<string>;
  tags?: Array<string>;
}
