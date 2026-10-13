// cac import: draft canonical documents from existing sources, then let a
// human accept them. See cli/src/importers/index.ts for the contract.

import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import YAML from "yaml";
import { COMPANY_DIR, REPO_ROOT } from "./paths.js";
import { IMPORTERS, findImporter, type Draft } from "./importers/index.js";
import { identityIndex, loadCorpus, loadSchemas, schemaForKind } from "./loader.js";
import { buildAjv } from "./validate.js";

export const DRAFTS_DIR = path.join(COMPANY_DIR, ".drafts");

function draftYaml(draft: Draft, importer: string, source: string): string {
  const header = [
    `# Drafted by 'cac import ${importer}' from ${source}.`,
    "# Status is 'proposed' until a human reviews it. Edit freely, then run",
    `# 'cac import accept ${importer}' to move it into the company graph.`,
    "",
  ].join("\n");
  return header + YAML.stringify(draft.data);
}

export async function importListCommand(): Promise<boolean> {
  for (const i of IMPORTERS) {
    console.log(`  ${i.name.padEnd(12)} ${i.summary}`);
    console.log(`  ${"".padEnd(12)} input: ${i.input}`);
  }
  return true;
}

export async function importDraftCommand(
  name: string,
  opts: { file: string; write: boolean },
  draftsDir: string = DRAFTS_DIR,
): Promise<boolean> {
  const importer = findImporter(name);
  if (!importer) {
    console.error(`✗ import: no importer named '${name}'. Run 'cac import list'.`);
    return false;
  }
  const source = path.basename(opts.file);
  const text = await fs.readFile(opts.file, "utf8");
  const { drafts, warnings } = importer.draft(text, { source });
  for (const w of warnings) console.log(`  ! ${w}`);
  if (drafts.length === 0) {
    console.error("✗ import: nothing to draft.");
    return false;
  }

  const ajv = buildAjv(await loadSchemas());
  let invalid = 0;
  for (const d of drafts) {
    const validator = ajv.getSchema(schemaForKind(d.kind) ?? "");
    if (validator && !validator(d.data)) {
      invalid++;
      console.error(`  ✗ ${d.path}: ${(validator.errors ?? []).map((e) => `${e.instancePath || "(root)"} ${e.message}`).join("; ")}`);
    }
  }
  const counts = new Map<string, number>();
  for (const d of drafts) counts.set(d.kind, (counts.get(d.kind) ?? 0) + 1);
  const summary = [...counts].map(([k, n]) => `${n} ${k}`).join(", ");
  const target = path.relative(REPO_ROOT, path.join(draftsDir, name));

  if (!opts.write) {
    console.log(`(dry-run) would draft ${summary} into ${target}/:`);
    for (const d of drafts) console.log(`  - ${d.path}`);
    console.log("\nNothing written. Re-run with --write to create the drafts.");
    return invalid === 0;
  }
  if (invalid > 0) {
    console.error(`✗ import: ${invalid} draft(s) would not validate. Fix the source and re-run.`);
    return false;
  }
  for (const d of drafts) {
    const full = path.join(draftsDir, name, d.path);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, draftYaml(d, name, source), "utf8");
  }
  console.log(`✓ import: drafted ${summary} into ${target}/.`);
  console.log(`Review them there, then run 'cac import accept ${name}'.`);
  return true;
}

export async function importAcceptCommand(
  name: string,
  opts: { into: string; write: boolean },
  draftsDir: string = DRAFTS_DIR,
  companyDir: string = COMPANY_DIR,
): Promise<boolean> {
  const from = path.join(draftsDir, name);
  const files = (await fg("**/*.{yaml,yml}", { cwd: from }).catch(() => [] as string[])).sort();
  if (files.length === 0) {
    console.error(`✗ import accept: no drafts in ${path.relative(REPO_ROOT, from)}/.`);
    return false;
  }

  const ajv = buildAjv(await loadSchemas());
  const existing = identityIndex(await loadCorpus());
  const into = path.resolve(companyDir, "..", opts.into);
  if (!into.startsWith(companyDir + path.sep)) {
    console.error(`✗ import accept: --into must be inside company/, got '${opts.into}'.`);
    return false;
  }

  const problems: string[] = [];
  const moves: { src: string; dest: string; id: string }[] = [];
  for (const f of files) {
    const src = path.join(from, f);
    const data = YAML.parse(await fs.readFile(src, "utf8"));
    const kind = data?.kind;
    const id = data?.canonicalId ?? data?.id ?? data?.name;
    const validator = ajv.getSchema(schemaForKind(kind) ?? "");
    if (!validator) {
      problems.push(`${f}: unknown kind '${kind}'`);
      continue;
    }
    if (!validator(data)) {
      problems.push(`${f}: ${(validator.errors ?? []).map((e) => `${e.instancePath || "(root)"} ${e.message}`).join("; ")}`);
      continue;
    }
    if (existing.get(kind)?.has(id)) {
      problems.push(`${f}: ${kind} '${id}' already exists at ${existing.get(kind)!.get(id)}. Merge by hand; an import never overwrites.`);
      continue;
    }
    moves.push({ src, dest: path.join(into, path.basename(f)), id });
  }

  for (const p of problems) console.error(`  ✗ ${p}`);
  const target = path.relative(REPO_ROOT, into);
  if (problems.length > 0) {
    console.error(`✗ import accept: ${problems.length} draft(s) cannot be accepted. Nothing moved.`);
    return false;
  }
  if (!opts.write) {
    console.log(`(dry-run) would move ${moves.length} draft(s) into ${target}/:`);
    for (const m of moves) console.log(`  - ${m.id}`);
    console.log("\nNothing moved. Re-run with --write to accept them.");
    return true;
  }
  await fs.mkdir(into, { recursive: true });
  for (const m of moves) await fs.rename(m.src, m.dest);
  console.log(`✓ import accept: ${moves.length} document(s) moved into ${target}/, still 'proposed'.`);
  console.log("Run 'npm run validate', then set status to 'active' on each entity a human has confirmed.");
  return true;
}
