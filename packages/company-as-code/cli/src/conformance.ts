// cac conformance: what "a correct implementation" means, written as data.
//
// The specification invites ports of the tooling to other languages. Without
// shared test cases, every port decides for itself what valid means, and the
// format splinters into dialects. The suite under /conformance fixes that:
// each case is a small company tree plus the verdict any implementation must
// reach on it.
//
// An implementation is any command that takes a case directory as its last
// argument and prints one JSON object:
//
//   { "valid": false, "failures": [ { "rule": "reference", "file": "company/x.yaml" } ] }
//
// Rules are coarse on purpose (classification, schema, reference,
// cross-document). Error wording belongs to each implementation; which file
// failed which rule does not.

import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import fg from "fast-glob";
import YAML from "yaml";
import { REPO_ROOT } from "./paths.js";
import { loadCorpusWithDiagnostics, loadSchemas } from "./loader.js";
import { buildAjv, crossDocumentChecks, schemaValidate } from "./validate.js";
import { resolveTypedEdges } from "./refs.js";

const exec = promisify(execFile);

export const CONFORMANCE_DIR = path.join(REPO_ROOT, "conformance");

export type Rule = "classification" | "schema" | "reference" | "cross-document";

export interface Failure {
  rule: Rule;
  /** Case-relative path of the offending document, or null for corpus-wide failures. */
  file: string | null;
}

export interface Verdict {
  valid: boolean;
  failures: Failure[];
}

export interface ConformanceCase {
  id: string;
  level: "validate";
  description: string;
  expect: Verdict;
  dir: string;
}

/** The reference implementation, run in-process against one case directory. */
export async function referenceVerdict(caseDir: string): Promise<Verdict> {
  const schemas = await loadSchemas();
  const ajv = buildAjv(schemas);
  const { corpus, unclassified } = await loadCorpusWithDiagnostics(path.join(caseDir, "company"), caseDir);

  const failures: Failure[] = [];
  for (const u of unclassified) failures.push({ rule: "classification", file: u.file });
  for (const p of schemaValidate(corpus, ajv)) failures.push({ rule: "schema", file: p.file });
  for (const e of resolveTypedEdges(corpus, schemas)) {
    if (e.toFile === null) failures.push({ rule: "reference", file: e.fromFile });
  }
  for (const message of crossDocumentChecks(corpus)) {
    const file = /^(\S+?\.ya?ml):/.exec(message)?.[1] ?? null;
    failures.push({ rule: "cross-document", file });
  }
  return { valid: failures.length === 0, failures: normalize(failures) };
}

function normalize(failures: Failure[]): Failure[] {
  const seen = new Map<string, Failure>();
  for (const f of failures) seen.set(`${f.rule}\u0000${f.file ?? ""}`, { rule: f.rule, file: f.file ?? null });
  return [...seen.values()].sort((a, b) => `${a.rule}${a.file}`.localeCompare(`${b.rule}${b.file}`));
}

export async function loadCases(dir: string = CONFORMANCE_DIR): Promise<ConformanceCase[]> {
  const files = await fg("cases/*/case.yaml", { cwd: dir });
  const cases: ConformanceCase[] = [];
  for (const f of files.sort()) {
    const data = YAML.parse(await fs.readFile(path.join(dir, f), "utf8"));
    cases.push({
      id: data.id,
      level: data.level,
      description: data.description,
      expect: { valid: data.expect.valid, failures: normalize(data.expect.failures ?? []) },
      dir: path.join(dir, path.dirname(f)),
    });
  }
  return cases;
}

async function externalVerdict(command: string, caseDir: string): Promise<Verdict> {
  const [bin, ...args] = command.split(/\s+/).filter(Boolean);
  const { stdout } = await exec(bin!, [...args, caseDir], { maxBuffer: 16 * 1024 * 1024 }).catch(
    (e: { stdout?: string }) => ({ stdout: e.stdout ?? "" }),
  );
  const parsed = JSON.parse(stdout) as Verdict;
  return { valid: parsed.valid, failures: normalize(parsed.failures ?? []) };
}

export function compare(expected: Verdict, actual: Verdict): string[] {
  const problems: string[] = [];
  if (expected.valid !== actual.valid) {
    problems.push(`expected valid=${expected.valid}, got valid=${actual.valid}`);
  }
  const key = (f: Failure) => `${f.rule} ${f.file ?? "(corpus)"}`;
  const want = new Set(expected.failures.map(key));
  const got = new Set(actual.failures.map(key));
  for (const k of want) if (!got.has(k)) problems.push(`missing failure: ${k}`);
  for (const k of got) if (!want.has(k)) problems.push(`unexpected failure: ${k}`);
  return problems;
}

export async function conformanceCommand(opts: { impl?: string; json?: boolean }): Promise<boolean> {
  const cases = await loadCases();
  let passed = 0;
  const results: { id: string; ok: boolean; problems: string[] }[] = [];
  for (const c of cases) {
    let problems: string[];
    try {
      const actual = opts.impl ? await externalVerdict(opts.impl, c.dir) : await referenceVerdict(c.dir);
      problems = compare(c.expect, actual);
    } catch (e) {
      problems = [`implementation error: ${(e as Error).message}`];
    }
    if (problems.length === 0) passed++;
    results.push({ id: c.id, ok: problems.length === 0, problems });
  }

  if (opts.json) {
    console.log(JSON.stringify({ implementation: opts.impl ?? "reference", passed, total: cases.length, results }, null, 2));
  } else {
    for (const r of results) {
      console.log(`  ${r.ok ? "✓" : "✗"} ${r.id}`);
      for (const p of r.problems) console.log(`      ${p}`);
    }
    console.log(`\nconformance (${opts.impl ?? "reference implementation"}): ${passed}/${cases.length} case(s) pass.`);
  }
  return passed === cases.length;
}

/** `cac conformance verdict <case-dir>`: the reference implementation, speaking the protocol. */
export async function verdictCommand(caseDir: string): Promise<boolean> {
  const verdict = await referenceVerdict(path.resolve(caseDir));
  console.log(JSON.stringify(verdict));
  return true;
}
