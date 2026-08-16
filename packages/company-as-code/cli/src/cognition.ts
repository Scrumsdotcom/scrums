// Cognition graph generator.
//
// Produces /generated/cognition-graph.json, the *structural* graph of the
// company: domains -> modules -> agents / workflows / metrics, with the
// module-to-module dependency edges. It is the static skeleton the runtime's
// `cac-host graph serve` renders as an interactive, real-time diagram, overlaid
// with live audit / event / HITL activity.
//
// This is the queryable, click-through evolution of the Mermaid diagrams in
// the docs: same picture, but generated from the source of truth and wired to
// live runtime state.

import type { RepoCorpus } from "./loader.js";
import type { GeneratedFile } from "./sdk.js";

function manifestPath(file: string): string {
  return file.replace(/\/manifest\.ya?ml$/, "");
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value, sortKeys, 2);
  function sortKeys(_k: string, v: any) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return Object.keys(v)
        .sort()
        .reduce((acc: Record<string, any>, key) => {
          acc[key] = v[key];
          return acc;
        }, {});
    }
    return v;
  }
}

interface GraphAgent {
  name: string;
  autonomy?: string;
  cadence?: string;
  runtime?: string;
}
interface GraphWorkflow {
  name: string;
  hitl: boolean;
  steps: number;
  trigger?: string;
}
interface GraphMetric {
  id: string;
  name: string;
  type?: string;
}
interface GraphModule {
  path: string;
  name: string;
  domain: string;
  lifecycle: string;
  purpose: string;
  agents: GraphAgent[];
  workflows: GraphWorkflow[];
  metrics: GraphMetric[];
  exposes: string[];
  consumes: number;
}
interface GraphDomain {
  name: string;
  moduleCount: number;
  modules: GraphModule[];
}
interface GraphEdge {
  from: string;
  to: string;
  interface: string;
}

export function cognitionGraph(corpus: RepoCorpus): GeneratedFile {
  // Index standalone agents by module so each module lists its real agents.
  const agentsByModule = new Map<string, GraphAgent[]>();
  for (const a of corpus.agents) {
    const mod = a.data.module as string | undefined;
    if (!mod) continue;
    const list = agentsByModule.get(mod) ?? [];
    list.push({
      name: a.data.name,
      autonomy: a.data.autonomy,
      cadence: a.data.cadence,
      runtime: a.data.runtime,
    });
    agentsByModule.set(mod, list);
  }

  // Workflows by module.
  const workflowsByModule = new Map<string, GraphWorkflow[]>();
  for (const wf of corpus.workflows) {
    const mod = wf.data.module as string | undefined;
    if (!mod) continue;
    const list = workflowsByModule.get(mod) ?? [];
    list.push({
      name: wf.data.name,
      hitl: wf.data.hitl === true,
      steps: (wf.data.steps ?? []).length,
      trigger: wf.data.trigger?.kind,
    });
    workflowsByModule.set(mod, list);
  }

  // Metrics by their owning module.
  const metricsByModule = new Map<string, GraphMetric[]>();
  for (const m of corpus.metrics) {
    const mod = m.data.owner?.module as string | undefined;
    if (!mod) continue;
    const list = metricsByModule.get(mod) ?? [];
    list.push({ id: m.data.id, name: m.data.name, type: m.data.type });
    metricsByModule.set(mod, list);
  }

  const modules: GraphModule[] = [];
  const edges: GraphEdge[] = [];
  for (const m of corpus.manifests) {
    const path = manifestPath(m.file);
    const exposes = ((m.data.exposes ?? []) as any[]).map((e) => e.interface as string);
    const consumes = (m.data.consumes ?? []) as any[];
    for (const c of consumes) {
      edges.push({ from: path, to: c.from, interface: c.interface });
    }
    modules.push({
      path,
      name: m.data.name,
      domain: m.data.domain,
      lifecycle: m.data.lifecycle,
      purpose: typeof m.data.purpose === "string" ? m.data.purpose.replace(/\s+/g, " ").trim() : "",
      agents: (agentsByModule.get(path) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
      workflows: (workflowsByModule.get(path) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
      metrics: (metricsByModule.get(path) ?? []).sort((a, b) => a.id.localeCompare(b.id)),
      exposes: exposes.slice().sort(),
      consumes: consumes.length,
    });
  }
  modules.sort((a, b) => a.path.localeCompare(b.path));
  edges.sort((a, b) =>
    (a.from + "->" + a.to + ":" + a.interface).localeCompare(
      b.from + "->" + b.to + ":" + b.interface,
    ),
  );

  // Group into domains.
  const domainOrder = [
    "executive",
    "finance-ops",
    "product-operations",
    "sales-marketing",
    "framework",
  ];
  const byDomain = new Map<string, GraphModule[]>();
  for (const mod of modules) {
    const list = byDomain.get(mod.domain) ?? [];
    list.push(mod);
    byDomain.set(mod.domain, list);
  }
  const domains: GraphDomain[] = [...byDomain.keys()]
    .sort((a, b) => {
      const ia = domainOrder.indexOf(a);
      const ib = domainOrder.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
    })
    .map((name) => ({
      name,
      moduleCount: byDomain.get(name)!.length,
      modules: byDomain.get(name)!,
    }));

  const out = {
    apiVersion: "company-as-code/v1",
    kind: "CognitionGraph",
    generatedFrom: "/company/**/manifest.yaml + agents + workflows + metrics",
    stats: {
      domainCount: domains.length,
      moduleCount: modules.length,
      agentCount: corpus.agents.length,
      workflowCount: corpus.workflows.length,
      metricCount: corpus.metrics.length,
      edgeCount: edges.length,
    },
    domains,
    edges,
  };
  return { name: "cognition-graph.json", content: stableStringify(out) + "\n" };
}
