// The company graph.
//
// Infrastructure-as-Code models a directed acyclic graph: resources depend on
// resources, and a cycle is an error. A company is not acyclic. Finance reads
// pipeline state from sales; sales reads collections posture from finance. The
// growth agent's output is the growth lead's input and vice versa. Modelling a
// company as a DAG means either deleting real edges or refusing to draw them.
//
// So the company graph is cyclic by construction. Nodes are canonical
// entities; edges are typed relations. Every edge is derived from an
// `x-cac-ref` annotation in the schemas plus the containment implied by module
// ownership. There is no hand-maintained edge list to fall out of date.

import { modulePathOf, type RepoCorpus } from "./loader.js";
import { resolveTypedEdges, type TypedEdge } from "./refs.js";

export interface GeneratedFile {
  name: string;
  content: string;
}

export interface GraphNode {
  id: string;
  kind: string;
  label: string;
  file: string;
  module?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  relation: string;
  /** "reference" edges come from x-cac-ref; "containment" from module ownership. */
  origin: "reference" | "containment";
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

/** Node IDs are namespaced by kind so a Goal and a Metric can never collide. */
function nodeId(kind: string, id: string): string {
  return `${kind}:${id}`;
}

export function buildGraph(
  corpus: RepoCorpus,
  schemas: Record<string, unknown>,
): { nodes: GraphNode[]; edges: GraphEdge[]; typed: TypedEdge[] } {
  const nodes = new Map<string, GraphNode>();

  const add = (kind: string, id: string, file: string, label: string, module?: string) => {
    const key = nodeId(kind, id);
    if (!nodes.has(key)) {
      const node: GraphNode = { id: key, kind, label, file };
      if (module) node.module = module;
      nodes.set(key, node);
    }
  };

  for (const m of corpus.manifests) {
    const path = modulePathOf(m.file);
    add("Manifest", path, m.file, m.data.name ?? path);
  }
  for (const bucket of Object.keys(corpus) as (keyof RepoCorpus)[]) {
    if (bucket === "manifests") continue;
    for (const doc of corpus[bucket]) {
      const kind = String(doc.data?.kind ?? "");
      const id = String(doc.data?.id ?? doc.data?.canonicalId ?? doc.data?.name ?? doc.file);
      if (!kind) continue;
      const label = doc.data?.title ?? doc.data?.name ?? doc.data?.displayName ?? id;
      add(kind, id, doc.file, String(label), doc.data?.module);
    }
  }

  const edges: GraphEdge[] = [];

  // Containment: an entity that names an owning module belongs to it. Drawn
  // separately from references so a consumer can hide structure and keep flow.
  for (const node of nodes.values()) {
    if (!node.module) continue;
    const target = nodeId("Manifest", node.module);
    if (nodes.has(target)) {
      edges.push({ from: target, to: node.id, relation: "contains", origin: "containment" });
    }
  }

  // Holder-shaped edges: `{ kind, id }` pairs that name a party rather than a
  // document. `x-cac-ref` cannot express them, because the kind that decides
  // where the id resolves lives in the data, not in the schema. Roles and
  // people are not documents in the corpus, so those links are recorded as
  // typed nodes of their own rather than dropped. The chain is only useful if
  // it can be read all the way to the end.
  const holderFields: Array<[string, (d: any) => unknown[]]> = [
    ["owner", (d) => [d.owner]],
    ["primaryOwner", (d) => [d.primaryOwner]],
    ["fallback", (d) => (d.fallback ?? []) as unknown[]],
    ["finalFallback", (d) => [d.finalFallback]],
    ["author", (d) => [d.author]],
  ];
  const holderEdges: GraphEdge[] = [];
  for (const bucket of Object.keys(corpus) as (keyof RepoCorpus)[]) {
    for (const doc of corpus[bucket]) {
      const kind = String(doc.data?.kind ?? "");
      if (!kind) continue;
      const fromId =
        bucket === "manifests"
          ? modulePathOf(doc.file)
          : String(doc.data?.id ?? doc.data?.canonicalId ?? doc.data?.name ?? doc.file);
      const from = nodeId(kind, fromId);
      if (!nodes.has(from)) continue;
      for (const [relation, pick] of holderFields) {
        for (const raw of pick(doc.data ?? {})) {
          const holder = raw as { kind?: string; id?: string } | undefined;
          if (!holder?.kind || !holder.id) continue;
          const targetKind =
            holder.kind === "module" ? "Manifest" : holder.kind === "agent" ? "Agent" : "Party";
          if (targetKind === "Party") {
            add("Party", `${holder.kind}:${holder.id}`, doc.file, holder.id);
          }
          const to =
            targetKind === "Party"
              ? nodeId("Party", `${holder.kind}:${holder.id}`)
              : nodeId(targetKind, holder.id);
          if (!nodes.has(to)) continue;
          holderEdges.push({ from, to, relation, origin: "reference" });
        }
      }
    }
  }
  edges.push(...holderEdges);

  const typed = resolveTypedEdges(corpus, schemas);
  for (const edge of typed) {
    if (!edge.toKind) continue; // dangling; validate reports it, the graph omits it
    const from = nodeId(edge.fromKind, edge.fromId);
    const to = nodeId(edge.toKind, edge.toId);
    if (!nodes.has(from) || !nodes.has(to)) continue;
    edges.push({ from, to, relation: edge.field, origin: "reference" });
  }

  edges.sort((a, b) => `${a.from}|${a.relation}|${a.to}`.localeCompare(`${b.from}|${b.relation}|${b.to}`));
  const deduped: GraphEdge[] = [];
  for (const e of edges) {
    const prev = deduped[deduped.length - 1];
    if (prev && prev.from === e.from && prev.to === e.to && prev.relation === e.relation) continue;
    deduped.push(e);
  }

  const nodeList = [...nodes.values()].sort((a, b) => a.id.localeCompare(b.id));
  return { nodes: nodeList, edges: deduped, typed };
}

/**
 * Entities nothing points at and which point at nothing. Not an error, a
 * newly declared requirement is legitimately isolated until a control names
 * it, but worth surfacing, because an orphan is usually a typo or an
 * abandoned artefact.
 */
function orphans(nodes: GraphNode[], edges: GraphEdge[]): string[] {
  const touched = new Set<string>();
  for (const e of edges) {
    touched.add(e.from);
    touched.add(e.to);
  }
  return nodes.filter((n) => !touched.has(n.id)).map((n) => n.id).sort();
}

export function companyGraph(corpus: RepoCorpus, schemas: Record<string, unknown>): GeneratedFile {
  const { nodes, edges } = buildGraph(corpus, schemas);
  const byKind: Record<string, number> = {};
  for (const n of nodes) byKind[n.kind] = (byKind[n.kind] ?? 0) + 1;
  const byRelation: Record<string, number> = {};
  for (const e of edges) byRelation[e.relation] = (byRelation[e.relation] ?? 0) + 1;

  const out = {
    generatedFrom: "/company/**/*.yaml + x-cac-ref annotations in /schemas",
    note:
      "Cyclic by construction. A company is not a DAG; edges here may form cycles and that is not an error.",
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodesByKind: byKind,
    edgesByRelation: byRelation,
    orphans: orphans(nodes, edges),
    nodes,
    edges,
  };
  return { name: "company-graph.json", content: stableStringify(out) };
}
