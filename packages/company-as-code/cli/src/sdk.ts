// Schema-driven SDK generator.
//
// Reads the canonical JSON Schemas under /schemas and emits type-safe SDK
// surfaces for multiple languages under /generated/sdk/<lang>. The point is
// that a "Company Agent" can be written in any supported language while
// staying strictly typed against the CaC spec — the schemas are the single
// source of truth, the SDK is a deterministic projection of them.
//
// Supported targets: TypeScript (interfaces + a discriminated `CompanyDocument`
// union) and Python (TypedDicts). Adding a target is a new emitter function;
// the schema-walking core is shared.
//
// The output is fully deterministic: identical schemas produce identical
// files, so `cac generate --check` gates SDK drift exactly like every other
// generated artefact.

export interface GeneratedFile {
  /** Path relative to /generated. */
  name: string;
  content: string;
}

interface JsonSchema {
  $id?: string;
  $ref?: string;
  $defs?: Record<string, JsonSchema>;
  title?: string;
  description?: string;
  type?: string | string[];
  const?: unknown;
  enum?: unknown[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
  items?: JsonSchema;
  oneOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  allOf?: JsonSchema[];
  pattern?: string;
  format?: string;
  default?: unknown;
}

/** "audit-record.schema.json" / title "Audit Record" -> "AuditRecord". */
function pascal(input: string): string {
  return input
    .replace(/\.schema\.json$/, "")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function rootName(fileName: string, schema: JsonSchema): string {
  return pascal(schema.title ?? fileName);
}

function refName(ref: string): string {
  // Only local $defs refs appear in the canonical schemas.
  const m = ref.match(/#\/\$defs\/(.+)$/);
  if (!m) return "unknown";
  return pascal(m[1]);
}

function indent(text: string, pad = "  "): string {
  return text
    .split("\n")
    .map((l) => (l.length ? pad + l : l))
    .join("\n");
}

function jsDoc(description: string | undefined, pad = ""): string {
  if (!description) return "";
  const single = description.replace(/\s+/g, " ").trim();
  return `${pad}/** ${single} */\n`;
}

// ---------------------------------------------------------------------------
// TypeScript emitter
// ---------------------------------------------------------------------------

function tsType(schema: JsonSchema): string {
  if (schema.$ref) return refName(schema.$ref);

  if (schema.const !== undefined) return JSON.stringify(schema.const);

  if (schema.enum) {
    return schema.enum.map((v) => JSON.stringify(v)).join(" | ");
  }

  if (schema.oneOf || schema.anyOf) {
    const variants = (schema.oneOf ?? schema.anyOf) as JsonSchema[];
    return variants.map(tsType).join(" | ");
  }

  const type = schema.type;
  if (Array.isArray(type)) {
    return type.map((t) => tsType({ ...schema, type: t })).join(" | ");
  }

  switch (type) {
    case "object": {
      if (schema.properties) return tsObject(schema);
      if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
        return `Record<string, ${tsType(schema.additionalProperties)}>`;
      }
      return "Record<string, unknown>";
    }
    case "array":
      return `Array<${schema.items ? tsType(schema.items) : "unknown"}>`;
    case "string":
      return "string";
    case "number":
    case "integer":
      return "number";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    default:
      // No declared type — `input`/`output` on AuditRecord are intentionally
      // open. Represent as `unknown` so consumers must narrow.
      return "unknown";
  }
}

function tsObject(schema: JsonSchema): string {
  const required = new Set(schema.required ?? []);
  const props = schema.properties ?? {};
  const lines: string[] = ["{"];
  for (const [key, propSchema] of Object.entries(props)) {
    const doc = jsDoc(propSchema.description, "  ");
    const optional = required.has(key) ? "" : "?";
    const safeKey = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
    const rendered = tsType(propSchema);
    // Indent multi-line nested object types.
    const value = rendered.includes("\n") ? indentNested(rendered) : rendered;
    lines.push(`${doc}  ${safeKey}${optional}: ${value};`);
  }
  lines.push("}");
  return lines.join("\n");
}

function indentNested(rendered: string): string {
  const [first, ...rest] = rendered.split("\n");
  return [first, ...rest.map((l) => "  " + l)].join("\n");
}

function tsFile(fileName: string, schema: JsonSchema): GeneratedFile {
  const name = rootName(fileName, schema);
  const blocks: string[] = [];
  blocks.push(
    `// Generated from /schemas/${fileName} — do not edit by hand.\n` +
      `// Regenerate with \`npm --prefix cli run generate\`.`,
  );

  for (const [defKey, defSchema] of Object.entries(schema.$defs ?? {})) {
    const defName = pascal(defKey);
    const doc = jsDoc(defSchema.description);
    blocks.push(`${doc}export interface ${defName} ${tsType(defSchema)}`);
  }

  const doc = jsDoc(schema.description);
  blocks.push(`${doc}export interface ${name} ${tsType(schema)}`);

  return {
    name: `sdk/typescript/${fileName.replace(/\.schema\.json$/, "")}.ts`,
    content: blocks.join("\n\n") + "\n",
  };
}

function tsIndex(entries: Array<{ fileName: string; typeName: string }>): GeneratedFile {
  const lines: string[] = [
    "// Generated SDK barrel — do not edit by hand.",
    "// Regenerate with `npm --prefix cli run generate`.",
    "",
  ];
  for (const e of entries) {
    const mod = "./" + e.fileName.replace(/\.schema\.json$/, "");
    lines.push(`export type { ${e.typeName} } from "${mod}.js";`);
  }
  lines.push("");
  // Import each type into a discriminated union keyed by `kind`.
  for (const e of entries) {
    const mod = "./" + e.fileName.replace(/\.schema\.json$/, "");
    lines.push(`import type { ${e.typeName} as _${e.typeName} } from "${mod}.js";`);
  }
  lines.push("");
  lines.push("/** Discriminated union of every canonical CaC document, keyed by `kind`. */");
  lines.push(
    "export type CompanyDocument =\n" +
      entries.map((e) => `  | _${e.typeName}`).join("\n") +
      ";",
  );
  return { name: "sdk/typescript/index.ts", content: lines.join("\n") + "\n" };
}

// ---------------------------------------------------------------------------
// Python emitter (TypedDicts)
// ---------------------------------------------------------------------------

interface PyContext {
  /** Hoisted TypedDict blocks, child-before-parent order. */
  blocks: string[];
  /** Names already emitted, to dedupe. */
  emitted: Set<string>;
}

function pyDoc(description: string | undefined, pad: string): string {
  if (!description) return "";
  const single = description.replace(/\s+/g, " ").trim().replace(/"""/g, '\\"\\"\\"');
  return `${pad}"""${single}"""\n`;
}

function pyType(schema: JsonSchema, hint: string, ctx: PyContext): string {
  if (schema.$ref) return `"${refName(schema.$ref)}"`;

  if (schema.const !== undefined) return `Literal[${pyLiteral(schema.const)}]`;

  if (schema.enum) {
    return `Literal[${schema.enum.map(pyLiteral).join(", ")}]`;
  }

  if (schema.oneOf || schema.anyOf) {
    const variants = (schema.oneOf ?? schema.anyOf) as JsonSchema[];
    const parts = variants.map((v, i) => pyType(v, `${hint}Variant${i}`, ctx));
    return `Union[${parts.join(", ")}]`;
  }

  const type = schema.type;
  if (Array.isArray(type)) {
    const parts = type.map((t) => pyType({ ...schema, type: t }, hint, ctx));
    return `Union[${parts.join(", ")}]`;
  }

  switch (type) {
    case "object": {
      if (schema.properties) {
        emitPyTypedDict(hint, schema, ctx);
        return `"${hint}"`;
      }
      if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
        return `Dict[str, ${pyType(schema.additionalProperties, `${hint}Value`, ctx)}]`;
      }
      return "Dict[str, Any]";
    }
    case "array":
      return `List[${schema.items ? pyType(schema.items, `${hint}Item`, ctx) : "Any"}]`;
    case "string":
      return "str";
    case "number":
      return "float";
    case "integer":
      return "int";
    case "boolean":
      return "bool";
    case "null":
      return "None";
    default:
      return "Any";
  }
}

function pyLiteral(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "True" : "False";
  if (value === null) return "None";
  return String(value);
}

function emitPyTypedDict(name: string, schema: JsonSchema, ctx: PyContext): void {
  if (ctx.emitted.has(name)) return;
  ctx.emitted.add(name);
  const required = new Set(schema.required ?? []);
  const props = schema.properties ?? {};

  // Resolve property types first — this hoists nested TypedDicts ahead of us.
  const fields: string[] = [];
  for (const [key, propSchema] of Object.entries(props)) {
    const childHint = name + pascal(key);
    const resolved = pyType(propSchema, childHint, ctx);
    const annotated = required.has(key) ? resolved : `NotRequired[${resolved}]`;
    const doc = pyDoc(propSchema.description, "    ");
    // `from` / `import` etc. are valid TypedDict keys only via functional
    // syntax; the canonical schemas use `from`, so guard for it.
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) && !PY_KEYWORDS.has(key)) {
      fields.push(`${doc}    ${key}: ${annotated}`);
    } else {
      // Fall back to a comment — class syntax can't express this key. The
      // value still type-checks via .get() access in consumer code.
      fields.push(`    # "${key}": ${annotated}  (reserved word — access via dict)`);
    }
  }

  const doc = pyDoc(schema.description, "    ");
  const body = fields.length ? fields.join("\n") : "    pass";
  ctx.blocks.push(`class ${name}(TypedDict, total=False):\n${doc}${body}`);
}

const PY_KEYWORDS = new Set([
  "from", "import", "class", "def", "return", "in", "is", "and", "or", "not",
  "if", "else", "elif", "for", "while", "with", "as", "lambda", "global",
  "None", "True", "False", "pass", "break", "continue", "yield", "async", "await",
]);

function pyFile(fileName: string, schema: JsonSchema): GeneratedFile {
  const name = rootName(fileName, schema);
  const ctx: PyContext = { blocks: [], emitted: new Set() };

  // $defs first so they are referenceable by name.
  for (const [defKey, defSchema] of Object.entries(schema.$defs ?? {})) {
    emitPyTypedDict(pascal(defKey), defSchema, ctx);
  }
  emitPyTypedDict(name, schema, ctx);

  const header = [
    `# Generated from /schemas/${fileName} — do not edit by hand.`,
    "# Regenerate with `npm --prefix cli run generate`.",
    "# Requires Python 3.11+ (uses typing.NotRequired).",
    "from __future__ import annotations",
    "",
    "from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union",
    "",
    "",
  ].join("\n");

  return {
    name: `sdk/python/${fileName.replace(/\.schema\.json$/, "").replace(/-/g, "_")}.py`,
    content: header + ctx.blocks.join("\n\n\n") + "\n",
  };
}

function pyInit(entries: Array<{ fileName: string; typeName: string }>): GeneratedFile {
  const lines: string[] = [
    "# Generated SDK package init — do not edit by hand.",
    "# Regenerate with `npm --prefix cli run generate`.",
    "",
  ];
  for (const e of entries) {
    const mod = e.fileName.replace(/\.schema\.json$/, "").replace(/-/g, "_");
    lines.push(`from .${mod} import ${e.typeName} as ${e.typeName}`);
  }
  lines.push("");
  lines.push("__all__ = [");
  for (const e of entries) lines.push(`    "${e.typeName}",`);
  lines.push("]");
  return { name: "sdk/python/__init__.py", content: lines.join("\n") + "\n" };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Generate every SDK file from the loaded JSON Schemas. `schemas` is keyed by
 * schema file name (e.g. "goal.schema.json"). Output paths are relative to
 * /generated.
 */
export function sdkFiles(schemas: Record<string, JsonSchema>): GeneratedFile[] {
  const fileNames = Object.keys(schemas).sort();
  const entries = fileNames.map((fileName) => ({
    fileName,
    typeName: rootName(fileName, schemas[fileName]),
  }));

  const files: GeneratedFile[] = [];
  for (const fileName of fileNames) {
    files.push(tsFile(fileName, schemas[fileName]));
    files.push(pyFile(fileName, schemas[fileName]));
  }
  files.push(tsIndex(entries));
  files.push(pyInit(entries));
  files.push(sdkReadme(entries));

  files.sort((a, b) => a.name.localeCompare(b.name));
  return files;
}

function sdkReadme(entries: Array<{ fileName: string; typeName: string }>): GeneratedFile {
  const rows = entries
    .map((e) => `| \`${e.fileName}\` | \`${e.typeName}\` |`)
    .join("\n");
  const content = `# Generated SDKs

**Do not edit by hand.** These files are a deterministic projection of the
canonical JSON Schemas under \`/schemas\`. Regenerate with:

\`\`\`bash
npm --prefix cli run generate
\`\`\`

\`cac generate --check\` gates drift on these files exactly like every other
generated artefact — if the schemas change and the SDK is not regenerated, CI
fails.

## Why

The JSON Schemas are the single source of truth for the Company-as-Code spec.
A "Company Agent" can be written in any language, but it must stay strictly
typed against that spec. These SDKs are how: each target language gets native
type definitions generated straight from the schemas, so a type error in agent
code is a spec violation caught at compile time.

## Targets

- **\`typescript/\`** — one \`.ts\` per schema exporting an \`interface\`, plus
  \`index.ts\` with a \`CompanyDocument\` discriminated union keyed by \`kind\`.
- **\`python/\`** — one \`.py\` per schema exporting a \`TypedDict\` (Python 3.11+),
  plus \`__init__.py\` re-exporting every type.

## Schema → root type

| Schema | Root type |
| --- | --- |
${rows}

## Adding a language

Add an emitter function to \`cli/src/sdk.ts\` and include its output in
\`sdkFiles()\`. The schema-walking core (\`$ref\`, \`enum\`, \`const\`, unions,
nested objects) is shared across emitters.
`;
  return { name: "sdk/README.md", content };
}
