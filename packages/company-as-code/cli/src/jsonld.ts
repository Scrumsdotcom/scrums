// Semantic interoperability.
//
// A company graph that only this framework can read is a private format with
// extra steps. The generated JSON-LD context maps the canonical primitives and
// their identifying fields onto vocabularies that already exist: schema.org
// for organizations and people, the W3C Organization ontology for reporting
// and membership, PROV-O for who did what to what, OSCAL for controls and
// evidence, and SKOS for the state ladder.
//
// Nothing in the framework depends on this. It exists so that an external
// system, a knowledge graph, or a regulator's tooling can consume the export
// without a bespoke adapter, and so that a fork can extend the mapping rather
// than invent one.

export interface GeneratedFile {
  name: string;
  content: string;
}

const VOCABULARIES = {
  cac: "https://company-as-code.dev/ns#",
  schema: "https://schema.org/",
  org: "http://www.w3.org/ns/org#",
  prov: "http://www.w3.org/ns/prov#",
  skos: "http://www.w3.org/2004/02/skos/core#",
  oscal: "https://pages.nist.gov/OSCAL/concepts/layer/",
  dcterms: "http://purl.org/dc/terms/",
  time: "http://www.w3.org/2006/time#",
} as const;

/**
 * Primitive-to-class mapping. Where an established vocabulary has the concept,
 * use it; where it does not, mint a term under the framework's own namespace
 * rather than stretching someone else's.
 */
const CLASSES: Record<string, string> = {
  Organization: "org:Organization",
  Person: "schema:Person",
  Manifest: "org:OrganizationalUnit",
  Agent: "prov:SoftwareAgent",
  Workflow: "cac:Workflow",
  Automation: "cac:Automation",
  Task: "cac:Task",
  Initiative: "cac:Initiative",
  Goal: "cac:Goal",
  Metric: "cac:Metric",
  Event: "prov:Activity",
  AuditRecord: "prov:Activity",
  Interface: "cac:Interface",
  Integration: "cac:Integration",
  Skill: "cac:Skill",
  Dashboard: "cac:Dashboard",
  Requirement: "oscal:Requirement",
  Control: "oscal:Control",
  Capability: "cac:Capability",
  Proposal: "cac:Proposal",
  StateSnapshot: "cac:StateSnapshot",
  EventTypeRegistry: "cac:EventTypeRegistry",
  AutonomyPolicy: "cac:AutonomyPolicy",
  EscalationPolicy: "cac:EscalationPolicy",
  ShadowEnrollment: "cac:ShadowEnrollment",
};

/**
 * Field-to-property mapping. Reference fields are typed as `@id` so a
 * consumer follows them as links rather than reading them as strings, the
 * same typed-edge idea the schemas carry, expressed in a vocabulary an
 * outside system already speaks.
 */
const PROPERTIES: Record<string, unknown> = {
  id: "@id",
  kind: "@type",
  apiVersion: "cac:apiVersion",
  name: "schema:name",
  title: "dcterms:title",
  description: "dcterms:description",
  purpose: "cac:purpose",
  owner: { "@id": "cac:owner", "@type": "@id" },
  module: { "@id": "org:unitOf", "@type": "@id" },
  parent: { "@id": "org:subOrganizationOf", "@type": "@id" },
  contacts: { "@id": "org:hasMember", "@type": "@id" },
  consumes: { "@id": "cac:consumes", "@type": "@id" },
  exposes: { "@id": "cac:exposes", "@type": "@id" },
  agents: { "@id": "cac:hasAgent", "@type": "@id" },
  skills: { "@id": "cac:hasSkill", "@type": "@id" },
  goals: { "@id": "cac:advancesGoal", "@type": "@id" },
  metrics: { "@id": "cac:measuredBy", "@type": "@id" },
  metric: { "@id": "cac:measuredBy", "@type": "@id" },
  measuredBy: { "@id": "cac:measuredBy", "@type": "@id" },
  implements: { "@id": "oscal:implementsRequirement", "@type": "@id" },
  evidence: { "@id": "oscal:evidence", "@type": "@id" },
  primaryOwner: { "@id": "cac:primaryOwner", "@type": "@id" },
  fallback: { "@id": "cac:fallbackTo", "@type": "@id" },
  finalFallback: { "@id": "cac:finalFallback", "@type": "@id" },
  requires: { "@id": "cac:requiresCapability", "@type": "@id" },
  supersedes: { "@id": "dcterms:replaces", "@type": "@id" },
  supersededBy: { "@id": "dcterms:isReplacedBy", "@type": "@id" },
  autonomy: "cac:autonomyClass",
  cadence: "cac:cadence",
  schedule: "cac:schedule",
  severity: "cac:severity",
  criticality: "cac:criticality",
  status: "cac:lifecycleStatus",
  state: { "@id": "cac:canonicalState", "@type": "@id" },
  lifecycleBucket: { "@id": "cac:lifecycleBucket", "@type": "@id" },
  framework: "cac:complianceFramework",
  clause: "cac:complianceClause",
  actor: { "@id": "prov:wasAssociatedWith", "@type": "@id" },
  emitsEvent: { "@id": "cac:emitsEvent", "@type": "@id" },
  traceId: "cac:traceId",
  correlationId: "cac:correlationId",
  dryRun: "cac:dryRun",
  createdAt: { "@id": "dcterms:created", "@type": "schema:DateTime" },
  updatedAt: { "@id": "dcterms:modified", "@type": "schema:DateTime" },
  date: { "@id": "dcterms:date", "@type": "schema:Date" },
  externalIds: { "@id": "cac:externalIdentifier", "@type": "@id" },
};

/** The four L1 buckets published as a SKOS scheme so consumers can align to it. */
const LIFECYCLE_BUCKETS = ["pending", "active", "resolved", "terminated"];

export function jsonLdContext(): GeneratedFile {
  const context: Record<string, unknown> = {
    "@version": 1.1,
    ...VOCABULARIES,
    ...PROPERTIES,
  };
  for (const [kind, iri] of Object.entries(CLASSES)) {
    context[kind] = { "@id": iri };
  }

  const doc = {
    "@context": context,
    "cac:lifecycleScheme": {
      "@type": "skos:ConceptScheme",
      "dcterms:title": "Company-as-Code L1 lifecycle buckets",
      "dcterms:description":
        "The universal lifecycle bucket every canonical entity projects onto. Fixed by the framework; L2 journey stages and L3 substates are module-owned and are not published here.",
      "skos:hasTopConcept": LIFECYCLE_BUCKETS.map((b) => ({
        "@id": `cac:${b}`,
        "@type": "skos:Concept",
        "skos:prefLabel": b,
      })),
    },
  };

  return {
    name: "context.jsonld",
    content: JSON.stringify(doc, null, 2),
  };
}
