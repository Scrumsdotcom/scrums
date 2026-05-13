import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import YAML from "yaml";
import type { WorkflowDoc } from "../types.js";

/**
 * Runtime-side loader.
 *
 * The dev-side CLI under /cli has its own loader that walks the whole corpus
 * for validation purposes. The runtime host needs a narrower lookup —
 * fetch a specific workflow by name + module, plus the related agent /
 * automation declarations.
 *
 * We keep this loader independent of the CLI's loader so the runtime can
 * be deployed without a vendored CLI dependency in production paths.
 */
export interface LoadedDoc {
  file: string;
  data: any;
}

export interface RepoIndex {
  repoRoot: string;
  workflows: Map<string, WorkflowDoc & { _file: string }>;
  agents: Map<string, any>;
  automations: Map<string, any>;
  eventTypes: Set<string>;
  workflowsByName(name: string): Array<WorkflowDoc & { _file: string }>;
}

export async function loadRepo(repoRoot: string): Promise<RepoIndex> {
  const companyDir = path.join(repoRoot, "company");
  const files = await fg(["**/*.yaml", "**/*.yml"], { cwd: companyDir, dot: false });
  files.sort();

  const workflows = new Map<string, WorkflowDoc & { _file: string }>();
  const agents = new Map<string, any>();
  const automations = new Map<string, any>();
  const eventTypes = new Set<string>();

  for (const rel of files) {
    const absolute = path.join(companyDir, rel);
    const text = await fs.readFile(absolute, "utf8");
    let parsed: any;
    try {
      parsed = YAML.parse(text);
    } catch {
      continue;
    }
    if (!parsed || typeof parsed !== "object") continue;
    const repoRelative = path.relative(repoRoot, absolute).split(path.sep).join("/");

    switch (parsed.kind) {
      case "Workflow": {
        const wf = parsed as WorkflowDoc;
        workflows.set(`${wf.module}::${wf.name}`, { ...wf, _file: repoRelative });
        break;
      }
      case "Agent": {
        agents.set(parsed.name, parsed);
        break;
      }
      case "Automation": {
        automations.set(parsed.name, parsed);
        break;
      }
      case "EventTypeRegistry": {
        for (const e of parsed.events ?? []) {
          if (typeof e?.type === "string") eventTypes.add(e.type);
        }
        break;
      }
    }
  }

  return {
    repoRoot,
    workflows,
    agents,
    automations,
    eventTypes,
    workflowsByName(name: string) {
      const matches: Array<WorkflowDoc & { _file: string }> = [];
      for (const wf of workflows.values()) if (wf.name === name) matches.push(wf);
      return matches;
    },
  };
}
