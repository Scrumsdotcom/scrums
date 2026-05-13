import fs from "node:fs/promises";
import path from "node:path";
import { GENERATED_DIR } from "./paths.js";
import { loadCorpus, type RepoCorpus } from "./loader.js";

interface GenerateOptions {
  check: boolean;
}

interface GeneratedFile {
  /** Path relative to /generated. */
  name: string;
  content: string;
}

export async function generateCommand(opts: GenerateOptions): Promise<boolean> {
  const corpus = await loadCorpus();
  const files: GeneratedFile[] = [
    agentCatalogue(corpus),
    flowRegistry(corpus),
    dependencyGraph(corpus),
    domainModel(corpus),
    ...contextBundles(corpus),
  ];

  if (opts.check) {
    return await checkDrift(files);
  } else {
    await writeAll(files);
    console.log(`✓ generated ${files.length} file(s) under /generated.`);
    return true;
  }
}

async function writeAll(files: GeneratedFile[]): Promise<void> {
  await fs.mkdir(GENERATED_DIR, { recursive: true });
  for (const f of files) {
    const full = path.join(GENERATED_DIR, f.name);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, f.content + (f.content.endsWith("\n") ? "" : "\n"), "utf8");
  }
}

async function checkDrift(files: GeneratedFile[]): Promise<boolean> {
  const drifted: string[] = [];
  for (const f of files) {
    const full = path.join(GENERATED_DIR, f.name);
    let current: string | null = null;
    try {
      current = await fs.readFile(full, "utf8");
    } catch {
      current = null;
    }
    const expected = f.content + (f.content.endsWith("\n") ? "" : "\n");
    if (current !== expected) {
      drifted.push(f.name);
    }
  }
  if (drifted.length === 0) {
    console.log(`✓ generate --check: /generated is in sync.`);
    return true;
  }
  console.error(`✗ generate --check: ${drifted.length} generated file(s) drifted:`);
  for (const d of drifted) console.error(`  - ${d}`);
  console.error(`Run 'npm run generate' and commit the result.`);
  return false;
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

function agentCatalogue(corpus: RepoCorpus): GeneratedFile {
  // Combine standalone agent files with agents declared inside manifests.
  type Entry = {
    name: string;
    module: string;
    purpose: string;
    runtime?: string;
    schedule?: string;
    cadence: string;
    autonomy: string;
    declaredIn: string;
  };
  const entries: Entry[] = [];

  for (const agent of corpus.agents) {
    entries.push({
      name: agent.data.name,
      module: agent.data.module,
      purpose: agent.data.purpose,
      runtime: agent.data.runtime,
      schedule: agent.data.schedule,
      cadence: agent.data.cadence,
      autonomy: agent.data.autonomy,
      declaredIn: agent.file,
    });
  }
  for (const m of corpus.manifests) {
    const mod = manifestPath(m.file);
    const declared = (m.data.agents ?? []) as any[];
    for (const a of declared) {
      // Skip duplicates already present as standalone files.
      if (entries.some((e) => e.name === a.name && e.module === mod)) continue;
      entries.push({
        name: a.name,
        module: mod,
        purpose: a.purpose,
        runtime: a.runtime,
        schedule: a.schedule,
        cadence: a.cadence,
        autonomy: a.autonomy,
        declaredIn: m.file,
      });
    }
  }

  entries.sort((a, b) => (a.module + "/" + a.name).localeCompare(b.module + "/" + b.name));
  const out = {
    generatedFrom: "/company/**/manifest.yaml + /company/**/agents/*.yaml",
    count: entries.length,
    agents: entries,
  };
  return { name: "agent-catalogue.json", content: stableStringify(out) };
}

function flowRegistry(corpus: RepoCorpus): GeneratedFile {
  type Entry = {
    name: string;
    module: string;
    purpose: string;
    trigger: any;
    hitl: boolean;
    steps: number;
    declaredIn: string;
  };
  const entries: Entry[] = [];
  for (const wf of corpus.workflows) {
    entries.push({
      name: wf.data.name,
      module: wf.data.module,
      purpose: wf.data.purpose,
      trigger: wf.data.trigger,
      hitl: wf.data.hitl === true,
      steps: (wf.data.steps ?? []).length,
      declaredIn: wf.file,
    });
  }
  entries.sort((a, b) => (a.module + "/" + a.name).localeCompare(b.module + "/" + b.name));
  const out = {
    generatedFrom: "/company/**/workflows/*.yaml",
    count: entries.length,
    workflows: entries,
  };
  return { name: "flow-registry.json", content: stableStringify(out) };
}

function dependencyGraph(corpus: RepoCorpus): GeneratedFile {
  type Edge = { from: string; to: string; interface: string; usage?: string };
  const edges: Edge[] = [];
  const modules: { path: string; exposes: string[]; consumes: number }[] = [];
  for (const m of corpus.manifests) {
    const mod = manifestPath(m.file);
    const exposes = (m.data.exposes ?? []).map((e: any) => e.interface as string).sort();
    const consumes = (m.data.consumes ?? []) as any[];
    modules.push({ path: mod, exposes, consumes: consumes.length });
    for (const c of consumes) {
      edges.push({ from: mod, to: c.from, interface: c.interface, usage: c.usage });
    }
  }
  modules.sort((a, b) => a.path.localeCompare(b.path));
  edges.sort((a, b) =>
    (a.from + "->" + a.to + ":" + a.interface).localeCompare(b.from + "->" + b.to + ":" + b.interface),
  );
  const out = {
    generatedFrom: "/company/**/manifest.yaml",
    moduleCount: modules.length,
    edgeCount: edges.length,
    modules,
    edges,
  };
  return { name: "dependency-graph.json", content: stableStringify(out) };
}

function domainModel(corpus: RepoCorpus): GeneratedFile {
  type Ownership = { module: string; tables: string[]; schemas: string[] };
  const ownership: Ownership[] = [];
  for (const m of corpus.manifests) {
    const tables = (m.data.owns?.tables ?? []) as string[];
    const schemas = (m.data.owns?.schemas ?? []) as string[];
    if (tables.length === 0 && schemas.length === 0) continue;
    ownership.push({ module: manifestPath(m.file), tables: tables.slice().sort(), schemas: schemas.slice().sort() });
  }
  ownership.sort((a, b) => a.module.localeCompare(b.module));
  const out = {
    generatedFrom: "/company/**/manifest.yaml (owns.tables + owns.schemas)",
    moduleCount: ownership.length,
    ownership,
  };
  return { name: "domain-model.json", content: stableStringify(out) };
}

function manifestPath(file: string): string {
  // company/domains/X/Y/manifest.yaml -> company/domains/X/Y
  return file.replace(/\/manifest\.ya?ml$/, "");
}

function contextBundles(corpus: RepoCorpus): GeneratedFile[] {
  // Build module-by-path lookup once.
  const moduleByPath = new Map<string, any>();
  for (const m of corpus.manifests) {
    moduleByPath.set(manifestPath(m.file), m.data);
  }

  const bundles: GeneratedFile[] = [];
  for (const agent of corpus.agents) {
    bundles.push(bundleFor(agent.data, agent.file, moduleByPath));
  }
  bundles.sort((a, b) => a.name.localeCompare(b.name));
  return bundles;
}

function bundleFor(
  agent: any,
  declaredIn: string,
  moduleByPath: Map<string, any>,
): GeneratedFile {
  const modulePath = agent.module as string;
  const owningModule = moduleByPath.get(modulePath);

  // Resolve interfaces the owning module exposes/consumes. The agent inherits
  // these as its read/write surface unless the agent declaration narrows them.
  const exposes = ((owningModule?.exposes ?? []) as any[]).map((e) => ({
    interface: e.interface,
    stability: e.stability,
    description: e.description,
  }));
  const consumes = ((owningModule?.consumes ?? []) as any[]).map((c) => ({
    interface: c.interface,
    from: c.from,
    usage: c.usage,
  }));

  // Outputs that emit a typed event become the agent's "canonical events".
  const emittedEvents = ((agent.outputs ?? []) as any[])
    .map((o) => o.emitsEvent)
    .filter(Boolean)
    .sort();

  // HITL constraints inherited from the module's invariants where they
  // mention the agent's name.
  const moduleInvariants = (owningModule?.invariants ?? []) as string[];
  const hitlConstraints = moduleInvariants.filter((inv) =>
    typeof inv === "string" && (inv.toLowerCase().includes("hitl") || inv.toLowerCase().includes("human") || inv.toLowerCase().includes("approval")),
  );

  const bundle = {
    apiVersion: "company-as-code/v1",
    kind: "ContextBundle",
    generatedFrom: declaredIn,
    agent: {
      name: agent.name,
      module: modulePath,
      purpose: agent.purpose,
      runtime: agent.runtime,
      schedule: agent.schedule,
      cadence: agent.cadence,
      autonomy: agent.autonomy,
      escalation: agent.escalation,
    },
    readAccess: {
      inputs: (agent.inputs ?? []).map((i: any) => ({
        name: i.name,
        type: i.type,
        from: i.from,
      })),
      moduleConsumes: consumes,
    },
    writeAccess: {
      outputs: (agent.outputs ?? []).map((o: any) => ({
        name: o.name,
        type: o.type,
        emitsEvent: o.emitsEvent,
      })),
      moduleExposes: exposes,
      hitlConstraints,
    },
    tools: (agent.tools ?? []).slice().sort(),
    memoryScope: agent.memoryScope,
    canonicalEvents: emittedEvents,
    observability: {
      dashboards: ((agent.observability?.dashboards ?? []) as string[]).slice().sort(),
      alerts: ((agent.observability?.alerts ?? []) as string[]).slice().sort(),
      auditTopic: agent.observability?.auditTopic,
    },
    invariants: (agent.invariants ?? []).slice(),
  };

  const slug = modulePath.replace(/\//g, "_") + "__" + agent.name + ".json";
  return { name: path.posix.join("context-bundles", slug), content: stableStringify(bundle) };
}
