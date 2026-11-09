// Typed reference resolution.
//
// Every cross-document reference in the schemas is annotated with
// `x-cac-ref: ["<Kind>", ...]`, naming the primitive kinds the field may point
// at. A reference field is therefore not just "a string". It is a typed edge
// to a known kind of entity, which makes the whole corpus one traversable
// graph.
//
// Two consumers read those annotations:
//
//   - `validate` resolves every edge and fails on the ones that dangle. One
//     generic resolver replaces the family of bespoke "does this ID exist"
//     checks that used to be written by hand, one per field.
//   - `generate` walks the same edges to emit /generated/company-graph.json,
//     so the graph is derived from the schemas rather than hand-maintained.
//
// The walker handles the constructs the canonical schemas actually use:
// `properties`, `items`, `$defs` via local `$ref`, and the `allOf` / `anyOf` /
// `oneOf` combinators. It deliberately does not implement the whole of JSON
// Schema; an unsupported construct silently carries no edges, which the
// annotation-coverage test guards against.

import { identityIndex, schemaFor, type LoadedDoc, type RepoCorpus } from "./loader.js";

export const REF_KEYWORD = "x-cac-ref";

export interface TypedEdge {
  /** Repo-root-relative path of the document holding the reference. */
  fromFile: string;
  /** Primitive kind of the referring document. */
  fromKind: string;
  /** Canonical identifier of the referring document (module path for manifests). */
  fromId: string;
  /** Dotted path of the field inside the referring document, e.g. `consumes[].from`. */
  field: string;
  /** Kinds this field is allowed to point at. */
  targetKinds: string[];
  /** The raw reference value. */
  toId: string;
  /** Repo-root-relative path of the resolved target, or null when it dangles. */
  toFile: string | null;
  /** Kind that actually resolved, or null when it dangles. */
  toKind: string | null;
}

interface SchemaNode {
  properties?: Record<string, SchemaNode>;
  items?: SchemaNode;
  $ref?: string;
  $defs?: Record<string, SchemaNode>;
  allOf?: SchemaNode[];
  anyOf?: SchemaNode[];
  oneOf?: SchemaNode[];
  [key: string]: unknown;
}

function refTargets(node: SchemaNode | undefined): string[] | undefined {
  const raw = node?.[REF_KEYWORD];
  if (Array.isArray(raw) && raw.every((k) => typeof k === "string")) return raw as string[];
  return undefined;
}

function deref(node: SchemaNode, root: SchemaNode): SchemaNode {
  if (typeof node.$ref !== "string") return node;
  const m = node.$ref.match(/^#\/\$defs\/(.+)$/);
  if (!m) return node;
  const target = root.$defs?.[m[1]!];
  return target ? { ...target, ...stripRef(node) } : node;
}

function stripRef(node: SchemaNode): SchemaNode {
  const { $ref: _ignored, ...rest } = node;
  return rest;
}

/**
 * Walk a schema and a document in parallel, yielding one entry per reference
 * value found. `path` accumulates a readable field name for diagnostics.
 */
function collect(
  schema: SchemaNode,
  data: unknown,
  root: SchemaNode,
  path: string,
  out: { field: string; targetKinds: string[]; value: string }[],
  seen: Set<SchemaNode>,
): void {
  if (data === undefined || data === null) return;
  const node = deref(schema, root);

  const targets = refTargets(node);
  if (targets && typeof data === "string") {
    out.push({ field: path || "(root)", targetKinds: targets, value: data });
    return;
  }

  // Combinators: a field's annotation may live on any branch. Recursing into
  // every branch is safe because a branch that does not match the data simply
  // finds nothing to collect.
  for (const key of ["allOf", "anyOf", "oneOf"] as const) {
    const branches = node[key];
    if (Array.isArray(branches)) {
      for (const branch of branches) {
        if (seen.has(branch)) continue;
        seen.add(branch);
        collect(branch, data, root, path, out, seen);
        seen.delete(branch);
      }
    }
  }

  if (Array.isArray(data)) {
    if (node.items) {
      for (const item of data) collect(node.items, item, root, `${path}[]`, out, seen);
    }
    return;
  }

  if (typeof data === "object" && node.properties) {
    for (const [key, child] of Object.entries(node.properties)) {
      const value = (data as Record<string, unknown>)[key];
      if (value === undefined) continue;
      collect(child, value, root, path ? `${path}.${key}` : key, out, seen);
    }
  }
}

/**
 * Resolve every typed reference in the corpus into an edge. Edges whose
 * `toFile` is null are dangling and are what `validate` reports.
 */
export function resolveTypedEdges(
  corpus: RepoCorpus,
  schemas: Record<string, unknown>,
): TypedEdge[] {
  const index = identityIndex(corpus);
  const edges: TypedEdge[] = [];

  for (const bucket of Object.keys(corpus) as (keyof RepoCorpus)[]) {
    const schema = schemas[schemaFor(bucket)] as SchemaNode | undefined;
    if (!schema) continue;
    for (const doc of corpus[bucket] as LoadedDoc[]) {
      const found: { field: string; targetKinds: string[]; value: string }[] = [];
      collect(schema, doc.data, schema, "", found, new Set());
      if (found.length === 0) continue;
      const fromKind = String(doc.data?.kind ?? "");
      const fromId = identityOf(doc, bucket);
      for (const hit of found) {
        let toFile: string | null = null;
        let toKind: string | null = null;
        for (const kind of hit.targetKinds) {
          const resolved = index.get(kind)?.get(hit.value);
          if (resolved) {
            toFile = resolved;
            toKind = kind;
            break;
          }
        }
        edges.push({
          fromFile: doc.file,
          fromKind,
          fromId,
          field: hit.field,
          targetKinds: hit.targetKinds,
          toId: hit.value,
          toFile,
          toKind,
        });
      }
    }
  }

  edges.sort((a, b) =>
    `${a.fromFile}|${a.field}|${a.toId}`.localeCompare(`${b.fromFile}|${b.field}|${b.toId}`),
  );
  return edges;
}

function identityOf(doc: LoadedDoc, bucket: keyof RepoCorpus): string {
  if (bucket === "manifests") return doc.file.replace(/\/manifest\.ya?ml$/, "");
  const data = doc.data ?? {};
  return String(data.id ?? data.canonicalId ?? data.name ?? doc.file);
}

/** Human-readable errors for every edge that failed to resolve. */
export function danglingReferenceErrors(edges: TypedEdge[]): string[] {
  return edges
    .filter((e) => e.toFile === null)
    .map(
      (e) =>
        `${e.fromFile}: ${e.field} references '${e.toId}', which is not a defined ${e.targetKinds.join(" or ")}.`,
    );
}
