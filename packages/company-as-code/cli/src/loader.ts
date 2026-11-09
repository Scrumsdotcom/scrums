import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import YAML from "yaml";
import { COMPANY_DIR, REPO_ROOT, SCHEMA_DIR } from "./paths.js";

export interface LoadedDoc {
  /** Repo-root-relative path. */
  file: string;
  /** Parsed YAML/JSON content. */
  data: any;
}

export interface RepoCorpus {
  manifests: LoadedDoc[];
  agents: LoadedDoc[];
  workflows: LoadedDoc[];
  tasks: LoadedDoc[];
  initiatives: LoadedDoc[];
  goals: LoadedDoc[];
  metrics: LoadedDoc[];
  interfaces: LoadedDoc[];
  organizations: LoadedDoc[];
  persons: LoadedDoc[];
  integrations: LoadedDoc[];
  skills: LoadedDoc[];
  dashboards: LoadedDoc[];
  automations: LoadedDoc[];
  eventTypeRegistries: LoadedDoc[];
  autonomyPolicies: LoadedDoc[];
  escalationPolicies: LoadedDoc[];
  events: LoadedDoc[];
  stateSnapshots: LoadedDoc[];
  shadowEnrollments: LoadedDoc[];
  requirements: LoadedDoc[];
  controls: LoadedDoc[];
  capabilities: LoadedDoc[];
  proposals: LoadedDoc[];
}

/** A /company YAML file that could not be classified into a primitive bucket. */
export interface UnclassifiedFile {
  /** Repo-root-relative path. */
  file: string;
  /** The `kind:` value found, if any. */
  kind?: string;
  reason: "missing-kind" | "unknown-kind" | "non-object";
}

export interface CorpusLoad {
  corpus: RepoCorpus;
  /**
   * Files under /company that parsed but did not classify into any bucket
   * and do not carry a `# cac:ignore` pragma. `validate` reports each of
   * these as an error. A one-character `kind:` typo must not silently
   * drop a document from the enforced corpus.
   */
  unclassified: UnclassifiedFile[];
}

const KIND_TO_BUCKET: Record<string, keyof RepoCorpus> = {
  Manifest: "manifests",
  Agent: "agents",
  Workflow: "workflows",
  Task: "tasks",
  Initiative: "initiatives",
  Goal: "goals",
  Metric: "metrics",
  Interface: "interfaces",
  Organization: "organizations",
  Person: "persons",
  Integration: "integrations",
  Skill: "skills",
  Dashboard: "dashboards",
  Automation: "automations",
  EventTypeRegistry: "eventTypeRegistries",
  AutonomyPolicy: "autonomyPolicies",
  EscalationPolicy: "escalationPolicies",
  Event: "events",
  StateSnapshot: "stateSnapshots",
  ShadowEnrollment: "shadowEnrollments",
  Requirement: "requirements",
  Control: "controls",
  Capability: "capabilities",
  Proposal: "proposals",
};

/**
 * The field that carries each primitive's identity. Typed references
 * (`x-cac-ref` in the schemas) resolve against these values, so this map is
 * what makes the whole corpus a traversable graph rather than a pile of
 * strings.
 *
 * `Manifest` is the exception: a module's identity is its path, derived from
 * the file location, because a module is a place in the organizational graph
 * rather than a document with an ID.
 */
const IDENTITY_FIELD: Partial<Record<keyof RepoCorpus, "id" | "name" | "canonicalId">> = {
  agents: "name",
  workflows: "name",
  tasks: "id",
  initiatives: "id",
  goals: "id",
  metrics: "id",
  interfaces: "name",
  organizations: "canonicalId",
  persons: "canonicalId",
  integrations: "name",
  skills: "name",
  dashboards: "name",
  automations: "name",
  eventTypeRegistries: "name",
  autonomyPolicies: "name",
  escalationPolicies: "name",
  events: "id",
  stateSnapshots: "id",
  shadowEnrollments: "id",
  requirements: "id",
  controls: "id",
  capabilities: "id",
  proposals: "id",
};

/** `company/domains/x/y/manifest.yaml` -> `company/domains/x/y`. */
export function modulePathOf(manifestFile: string): string {
  return manifestFile.replace(/\/manifest\.ya?ml$/, "");
}

/**
 * Index of every canonical identifier in the corpus, keyed by primitive kind.
 * Built once and consumed by the reference resolver and the graph generator.
 */
export function identityIndex(corpus: RepoCorpus): Map<string, Map<string, string>> {
  const index = new Map<string, Map<string, string>>();
  for (const [kind, bucket] of Object.entries(KIND_TO_BUCKET) as [string, keyof RepoCorpus][]) {
    const byId = new Map<string, string>();
    if (bucket === "manifests") {
      for (const doc of corpus.manifests) byId.set(modulePathOf(doc.file), doc.file);
    } else {
      const field = IDENTITY_FIELD[bucket];
      if (!field) continue;
      for (const doc of corpus[bucket]) {
        const value = doc.data?.[field];
        if (typeof value === "string") byId.set(value, doc.file);
      }
    }
    index.set(kind, byId);
  }
  return index;
}

/**
 * A YAML file that is intentionally not a CaC primitive (e.g. a JSON-Schema
 * payload document) opts out of corpus classification with a `# cac:ignore`
 * comment in its first few lines.
 */
const IGNORE_PRAGMA = "cac:ignore";

function hasIgnorePragma(text: string): boolean {
  return text
    .split("\n", 10)
    .some((line) => line.startsWith("#") && line.includes(IGNORE_PRAGMA));
}

export async function loadSchemas(): Promise<Record<string, any>> {
  const files = await fg("*.schema.json", { cwd: SCHEMA_DIR });
  const out: Record<string, any> = {};
  for (const f of files) {
    const text = await fs.readFile(path.join(SCHEMA_DIR, f), "utf8");
    out[f] = JSON.parse(text);
  }
  return out;
}

export async function loadCorpus(): Promise<RepoCorpus> {
  return (await loadCorpusWithDiagnostics()).corpus;
}

/**
 * An empty corpus with one bucket per primitive. Exported because tests build
 * partial corpora by hand: deriving them from this constructor means adding a
 * primitive cannot leave a test file behind with a missing bucket.
 */
export function emptyCorpus(): RepoCorpus {
  return Object.fromEntries(
    Object.values(KIND_TO_BUCKET).map((bucket) => [bucket, [] as LoadedDoc[]]),
  ) as unknown as RepoCorpus;
}

/**
 * `companyDir` and `root` default to this repository. The conformance runner
 * points them at a test case instead, so one loader serves both.
 */
export async function loadCorpusWithDiagnostics(
  companyDir: string = COMPANY_DIR,
  root: string = REPO_ROOT,
): Promise<CorpusLoad> {
  const corpus: RepoCorpus = emptyCorpus();
  const unclassified: UnclassifiedFile[] = [];

  const patterns = ["**/*.yaml", "**/*.yml"];
  const ignore = ["**/node_modules/**"];
  const files = await fg(patterns, { cwd: companyDir, ignore, dot: false });
  files.sort();

  for (const rel of files) {
    const absolute = path.join(companyDir, rel);
    const text = await fs.readFile(absolute, "utf8");
    let parsed: any;
    try {
      parsed = YAML.parse(text);
    } catch (e) {
      throw new Error(`Failed to parse YAML in ${rel}: ${(e as Error).message}`);
    }
    const repoRelative = path.relative(root, absolute).split(path.sep).join("/");
    if (!parsed || typeof parsed !== "object") {
      if (!hasIgnorePragma(text)) {
        unclassified.push({ file: repoRelative, reason: "non-object" });
      }
      continue;
    }
    const kind = parsed.kind;
    const bucket = KIND_TO_BUCKET[kind];
    if (!bucket) {
      if (!hasIgnorePragma(text)) {
        unclassified.push({
          file: repoRelative,
          kind: typeof kind === "string" ? kind : undefined,
          reason: kind === undefined ? "missing-kind" : "unknown-kind",
        });
      }
      continue;
    }
    corpus[bucket].push({ file: repoRelative, data: parsed });
  }

  for (const k of Object.keys(corpus) as (keyof RepoCorpus)[]) {
    corpus[k].sort((a, b) => a.file.localeCompare(b.file));
  }
  return { corpus, unclassified };
}

const BUCKET_TO_SCHEMA: Record<keyof RepoCorpus, string> = {
  manifests: "manifest.schema.json",
  agents: "agent.schema.json",
  workflows: "workflow.schema.json",
  tasks: "task.schema.json",
  initiatives: "initiative.schema.json",
  goals: "goal.schema.json",
  metrics: "metric.schema.json",
  interfaces: "interface.schema.json",
  organizations: "organization.schema.json",
  persons: "person.schema.json",
  integrations: "integration.schema.json",
  skills: "skill.schema.json",
  dashboards: "dashboard.schema.json",
  automations: "automation.schema.json",
  eventTypeRegistries: "event-type-registry.schema.json",
  autonomyPolicies: "autonomy-policy.schema.json",
  escalationPolicies: "escalation-policy.schema.json",
  events: "event.schema.json",
  stateSnapshots: "state-snapshot.schema.json",
  shadowEnrollments: "shadow-enrollment.schema.json",
  requirements: "requirement.schema.json",
  controls: "control.schema.json",
  capabilities: "capability.schema.json",
  proposals: "proposal.schema.json",
};

export function schemaFor(bucket: keyof RepoCorpus): string {
  return BUCKET_TO_SCHEMA[bucket];
}

/**
 * Resolve the schema file name for a primitive `kind` string. Used outside the
 * corpus loader (e.g. the hub, which validates payload files by their kind).
 * Returns undefined for kinds with no validatable schema (Doc, Asset, prose).
 */
export function schemaForKind(kind: string): string | undefined {
  const bucket = KIND_TO_BUCKET[kind];
  if (!bucket) return undefined;
  return BUCKET_TO_SCHEMA[bucket];
}
