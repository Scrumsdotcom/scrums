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
};

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
  const corpus: RepoCorpus = {
    manifests: [],
    agents: [],
    workflows: [],
    tasks: [],
    initiatives: [],
    goals: [],
    metrics: [],
    interfaces: [],
    organizations: [],
    persons: [],
    integrations: [],
  };

  const patterns = ["**/*.yaml", "**/*.yml"];
  const ignore = ["**/node_modules/**"];
  const files = await fg(patterns, { cwd: COMPANY_DIR, ignore, dot: false });
  files.sort();

  for (const rel of files) {
    const absolute = path.join(COMPANY_DIR, rel);
    const text = await fs.readFile(absolute, "utf8");
    let parsed: any;
    try {
      parsed = YAML.parse(text);
    } catch (e) {
      throw new Error(`Failed to parse YAML in ${rel}: ${(e as Error).message}`);
    }
    if (!parsed || typeof parsed !== "object") continue;
    const kind = parsed.kind;
    const bucket = KIND_TO_BUCKET[kind];
    if (!bucket) continue;
    const repoRelative = path.relative(REPO_ROOT, absolute).split(path.sep).join("/");
    corpus[bucket].push({ file: repoRelative, data: parsed });
  }

  for (const k of Object.keys(corpus) as (keyof RepoCorpus)[]) {
    corpus[k].sort((a, b) => a.file.localeCompare(b.file));
  }
  return corpus;
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
};

export function schemaFor(bucket: keyof RepoCorpus): string {
  return BUCKET_TO_SCHEMA[bucket];
}
