// CaC-Hub, the community module registry.
//
// A hub module lives under hub/modules/<name>/ as a `hub-module.yaml` (metadata)
// plus a payload/ directory of files to scaffold into a company's /company tree.
// This module loads them, generates the registry index, and powers the
// `cac hub` commands: list / show / add / validate.
//
// `cac hub add` is dry-run by default. It prints the projected file writes
// before they land, mirroring the framework's dry-run-first discipline.

import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import YAML from "yaml";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { HUB_DIR, REPO_ROOT } from "./paths.js";
import { strictParse } from "./cli-args.js";
import { loadSchemas, schemaForKind } from "./loader.js";
import { buildAjv } from "./validate.js";
import type { GeneratedFile } from "./sdk.js";

export interface HubModule {
  /** Repo-relative path to the hub-module.yaml. */
  file: string;
  /** Directory holding the module (hub/modules/<name>). */
  dir: string;
  /** Parsed hub-module.yaml. */
  data: any;
  /** Payload files discovered on disk, repo-relative, sorted. */
  payloadFiles: string[];
}

export async function loadHubModules(): Promise<HubModule[]> {
  const metaFiles = await fg("modules/*/hub-module.yaml", { cwd: HUB_DIR, dot: false });
  metaFiles.sort();
  const modules: HubModule[] = [];
  for (const rel of metaFiles) {
    const absolute = path.join(HUB_DIR, rel);
    const text = await fs.readFile(absolute, "utf8");
    let data: any;
    try {
      data = YAML.parse(text);
    } catch (e) {
      throw new Error(`Failed to parse hub module YAML in ${rel}: ${(e as Error).message}`);
    }
    const dir = path.dirname(absolute);
    const payloadDir = path.join(dir, "payload");
    const payloadGlob = await fg("**/*", { cwd: payloadDir, dot: false, onlyFiles: true }).catch(
      () => [] as string[],
    );
    payloadGlob.sort();
    modules.push({
      file: repoRel(absolute),
      dir: repoRel(dir),
      data,
      payloadFiles: payloadGlob,
    });
  }
  return modules;
}

function repoRel(absolute: string): string {
  return path.relative(REPO_ROOT, absolute).split(path.sep).join("/");
}

// ---------------------------------------------------------------------------
// Generator: /generated/hub-index.json
// ---------------------------------------------------------------------------

export function hubIndex(modules: HubModule[]): GeneratedFile {
  const entries = modules
    .map((m) => ({
      name: m.data.name,
      version: m.data.version,
      summary: m.data.summary,
      category: m.data.category,
      maturity: m.data.maturity,
      targetDomain: m.data.targetDomain ?? null,
      tags: ((m.data.tags ?? []) as string[]).slice().sort(),
      relatedModules: ((m.data.relatedModules ?? []) as string[]).slice().sort(),
      scaffoldCount: (m.data.scaffolds ?? []).length,
      payloadFiles: m.payloadFiles.slice().sort(),
      declaredIn: m.file,
    }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const out = {
    generatedFrom: "/hub/modules/*/hub-module.yaml",
    count: entries.length,
    modules: entries,
  };
  return { name: "hub-index.json", content: stableStringify(out) + "\n" };
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

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface HubProblem {
  module: string;
  file: string;
  errors: string[];
}

export async function validateHub(): Promise<HubProblem[]> {
  const schemas = await loadSchemas();
  const ajv = buildAjv(schemas);
  const modules = await loadHubModules();
  const problems: HubProblem[] = [];

  const hubSchema = ajv.getSchema("hub-module.schema.json");
  if (!hubSchema) throw new Error("hub-module.schema.json not loaded");

  for (const m of modules) {
    // 1. hub-module.yaml validates against the HubModule schema.
    if (!hubSchema(m.data)) {
      problems.push({
        module: m.data?.name ?? m.file,
        file: m.file,
        errors: (hubSchema.errors ?? []).map((e) => `${e.instancePath || "(root)"} ${e.message}`),
      });
    }

    // 2. Every declared scaffold exists on disk, and vice versa.
    const declared = ((m.data?.scaffolds ?? []) as Array<{ path: string }>).map((s) => s.path);
    const declaredSet = new Set(declared);
    const onDisk = new Set(m.payloadFiles);
    for (const d of declared) {
      if (!onDisk.has(d)) {
        problems.push({
          module: m.data?.name ?? m.file,
          file: `${m.dir}/payload/${d}`,
          errors: ["declared in scaffolds[] but missing from payload/"],
        });
      }
    }
    for (const f of m.payloadFiles) {
      if (!declaredSet.has(f)) {
        problems.push({
          module: m.data?.name ?? m.file,
          file: `${m.dir}/payload/${f}`,
          errors: ["present in payload/ but not declared in scaffolds[]"],
        });
      }
    }

    // 3. Every payload file with a known primitive kind validates against the
    //    matching framework schema. Doc / Asset payloads are skipped.
    for (const s of (m.data?.scaffolds ?? []) as Array<{ path: string; kind: string }>) {
      const schemaFile = schemaForKind(s.kind);
      if (!schemaFile) continue; // Doc, Asset, or unknown, not schema-validated
      const abs = path.join(REPO_ROOT, m.dir, "payload", s.path);
      let parsed: any;
      try {
        parsed = YAML.parse(await fs.readFile(abs, "utf8"));
      } catch (e) {
        problems.push({
          module: m.data?.name ?? m.file,
          file: `${m.dir}/payload/${s.path}`,
          errors: [`failed to parse: ${(e as Error).message}`],
        });
        continue;
      }
      const validator = ajv.getSchema(schemaFile);
      if (validator && !validator(parsed)) {
        problems.push({
          module: m.data?.name ?? m.file,
          file: `${m.dir}/payload/${s.path}`,
          errors: (validator.errors ?? []).map(
            (e) => `[${s.kind}] ${e.instancePath || "(root)"} ${e.message}`,
          ),
        });
      }
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

export async function hubListCommand(): Promise<boolean> {
  const modules = await loadHubModules();
  if (modules.length === 0) {
    console.log("(no hub modules under /hub/modules)");
    return true;
  }
  console.log(`CaC-Hub, ${modules.length} module(s):\n`);
  for (const m of modules) {
    const d = m.data;
    console.log(`  ${String(d.name).padEnd(22)} ${String(d.version).padEnd(8)} ${String(d.category).padEnd(14)} ${d.maturity}`);
    console.log(`  ${" ".repeat(22)} ${d.summary}`);
    console.log("");
  }
  console.log(`Inspect one with:  cac hub show <name>`);
  console.log(`Scaffold one with: cac hub add <name>            (dry-run)`);
  console.log(`                   cac hub add <name> --write    (apply)`);
  return true;
}

export async function hubShowCommand(name: string): Promise<boolean> {
  const modules = await loadHubModules();
  const m = modules.find((x) => x.data?.name === name);
  if (!m) {
    console.error(`hub show: no module named '${name}'. Run 'cac hub list'.`);
    return false;
  }
  const d = m.data;
  console.log(`${d.name} ${d.version}  [${d.category} · ${d.maturity}]`);
  console.log(`\n${d.summary}\n`);
  if (d.description) console.log(`${String(d.description).trim()}\n`);
  console.log(`provenance:   ${d.provenance?.author} (${d.provenance?.license})`);
  if (d.provenance?.sourceUrl) console.log(`source:       ${d.provenance.sourceUrl}`);
  if (d.targetDomain) console.log(`targetDomain: ${d.targetDomain}`);
  if ((d.tags ?? []).length) console.log(`tags:         ${(d.tags as string[]).join(", ")}`);
  if ((d.relatedModules ?? []).length)
    console.log(`related:      ${(d.relatedModules as string[]).join(", ")}`);
  console.log(`\nscaffolds (${(d.scaffolds ?? []).length}):`);
  for (const s of (d.scaffolds ?? []) as Array<{ path: string; kind: string; description?: string }>) {
    console.log(`  ${s.path.padEnd(34)} [${s.kind}] ${s.description ?? ""}`);
  }
  if ((d.consumes ?? []).length) {
    console.log(`\nconsumes (framework interfaces expected to exist):`);
    for (const c of d.consumes as Array<{ interface: string; reason?: string }>) {
      console.log(`  ${c.interface}${c.reason ? `, ${c.reason}` : ""}`);
    }
  }
  return true;
}

export interface HubAddOptions {
  /** When false (default), only print the projected writes. */
  write: boolean;
  /** Destination directory, repo-relative. Overrides the derived path. */
  into?: string;
}

export async function hubAddCommand(name: string, opts: HubAddOptions): Promise<boolean> {
  const modules = await loadHubModules();
  const m = modules.find((x) => x.data?.name === name);
  if (!m) {
    console.error(`hub add: no module named '${name}'. Run 'cac hub list'.`);
    return false;
  }
  const d = m.data;

  // Destination: explicit --into, else derived from targetDomain.
  const destRel = opts.into
    ? normalizeRel(opts.into)
    : d.targetDomain === "framework"
      ? `company/${d.name}`
      : `company/domains/${d.targetDomain}/${d.name}`;
  const destAbs = path.resolve(REPO_ROOT, destRel);

  // Scaffolds land under /company, full stop. A --into containing `..` (or
  // an absolute path) must not be able to write outside the company tree.
  const companyRoot = path.resolve(REPO_ROOT, "company");
  if (destAbs !== companyRoot && !destAbs.startsWith(companyRoot + path.sep)) {
    console.error(
      `hub add: destination '${destRel}' resolves outside /company. Refusing to scaffold there.`,
    );
    return false;
  }

  // Compute the projected writes.
  const payloadDir = path.join(REPO_ROOT, m.dir, "payload");
  const projected: Array<{ from: string; to: string; exists: boolean }> = [];
  for (const rel of m.payloadFiles) {
    const toAbs = path.join(destAbs, rel);
    let exists = false;
    try {
      await fs.stat(toAbs);
      exists = true;
    } catch {
      exists = false;
    }
    projected.push({ from: `${m.dir}/payload/${rel}`, to: `${destRel}/${rel}`, exists });
  }

  const collisions = projected.filter((p) => p.exists);

  console.log(`hub add ${d.name} ${d.version} → ${destRel}`);
  console.log(`${opts.write ? "APPLYING" : "DRY-RUN, no files written"} (${projected.length} file(s))\n`);
  for (const p of projected) {
    const mark = p.exists ? "EXISTS!" : "create ";
    console.log(`  ${mark}  ${p.to}`);
  }
  if ((d.consumes ?? []).length) {
    console.log(`\n  ⚠ this module expects these interfaces to already exist:`);
    for (const c of d.consumes as Array<{ interface: string; reason?: string }>) {
      console.log(`      ${c.interface}${c.reason ? `, ${c.reason}` : ""}`);
    }
  }

  if (collisions.length > 0) {
    console.error(
      `\n✗ hub add: ${collisions.length} destination file(s) already exist. ` +
        `Refusing to overwrite. Choose a different --into path or remove the collisions.`,
    );
    return false;
  }

  if (!opts.write) {
    console.log(`\nRe-run with --write to apply. Then: cd cli && npm run validate && npm run generate`);
    return true;
  }

  // Apply.
  for (const rel of m.payloadFiles) {
    const fromAbs = path.join(payloadDir, rel);
    const toAbs = path.join(destAbs, rel);
    await fs.mkdir(path.dirname(toAbs), { recursive: true });
    await fs.copyFile(fromAbs, toAbs);
  }
  console.log(`\n✓ scaffolded ${projected.length} file(s) into ${destRel}`);
  console.log(`  next: fill in TBD placeholders, then 'cd cli && npm run validate && npm run generate'`);
  return true;
}

function normalizeRel(p: string): string {
  return p.replace(/^\.?\/+/, "").replace(/\/+$/, "");
}

export async function hubValidateCommand(): Promise<boolean> {
  const problems = await validateHub();
  const modules = await loadHubModules();
  if (problems.length === 0) {
    const payloadCount = modules.reduce((n, m) => n + m.payloadFiles.length, 0);
    console.log(
      `✓ hub validate: ${modules.length} module(s), ${payloadCount} payload file(s), all schema-valid.`,
    );
    return true;
  }
  console.error(`✗ hub validate: ${problems.length} problem(s):`);
  for (const p of problems) {
    console.error(`  ${p.file} [${p.module}]`);
    for (const e of p.errors) console.error(`    - ${e}`);
  }
  return false;
}

/** Top-level dispatcher for `cac hub <subcommand>`. */
export async function hubCommand(rest: string[]): Promise<boolean> {
  const [sub, ...args] = rest;
  switch (sub) {
    case "list":
      return await hubListCommand();
    case "show": {
      if (!args[0]) {
        console.error("hub show: missing module name");
        return false;
      }
      return await hubShowCommand(args[0]);
    }
    case "add": {
      const parsed = strictParse(
        "hub add",
        args,
        { write: { type: "boolean" }, into: { type: "string" } },
        true,
      );
      if (!parsed) return false;
      const [name, ...extra] = parsed.positionals;
      if (!name) {
        console.error("hub add: missing module name");
        return false;
      }
      if (extra.length > 0) {
        console.error(`hub add: unexpected argument(s): ${extra.join(" ")}`);
        return false;
      }
      return await hubAddCommand(name, {
        write: parsed.values.write === true,
        into: parsed.values.into as string | undefined,
      });
    }
    case "validate":
      return await hubValidateCommand();
    default:
      console.error(
        `hub: unknown subcommand '${sub ?? ""}' (expected list | show | add | validate)`,
      );
      return false;
  }
}
