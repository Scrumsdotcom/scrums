// Generated from /schemas/hub-module.schema.json — do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** Metadata for a community-contributed, importable module in the CaC-Hub. A hub module bundles a validated payload (manifest, workflows, agents, policies) that `cac hub add` scaffolds into a company's /company tree. The hub is how a company forks or imports shared building blocks while keeping every artefact schema-valid. */
export interface HubModule {
  apiVersion: "company-as-code/v1";
  kind: "HubModule";
  /** Kebab-case hub module identifier, unique within the hub. */
  name: string;
  /** Semantic version of the hub module. */
  version: string;
  /** One-sentence description of what this module gives a company. */
  summary: string;
  /** Longer prose: what the module contains, when to import it, what to fill in after. */
  description?: string;
  /** What kind of building block this is. */
  category: "integration" | "domain" | "policy" | "workflow-pack" | "observability" | "other";
  /** How battle-tested the module is. New community contributions start experimental. */
  maturity: "experimental" | "beta" | "stable";
  /** The CaC apiVersion this module's payload targets. */
  frameworkVersion?: "company-as-code/v1";
  /** Where the module came from — the hub is open-source and attribution matters. */
  provenance: {
    /** Contributing person or organization. */
    author: string;
    /** SPDX license identifier, e.g. 'Apache-2.0'. */
    license: string;
    /** Upstream repository or homepage. */
    sourceUrl?: string;
    maintainers?: Array<string>;
  };
  /** Default domain the payload manifest belongs to. `cac hub add` derives the install path from this unless --into is given. */
  targetDomain?: "executive" | "finance-ops" | "product-operations" | "sales-marketing" | "framework";
  /** Every file in payload/ that `cac hub add` will write into the company tree. */
  scaffolds: Array<{
    /** Path relative to payload/, e.g. 'manifest.yaml'. */
    path: string;
    /** The CaC primitive kind this file declares, or 'Doc' for prose / 'Asset' for other files. */
    kind: string;
    description?: string;
  }>;
  /** Framework interfaces the payload expects to already exist in the importing company. `cac hub add` warns when these are unmet. */
  consumes?: Array<{
    interface: string;
    reason?: string;
  }>;
  tags?: Array<string>;
  /** Other hub module names that pair well with this one. */
  relatedModules?: Array<string>;
}
