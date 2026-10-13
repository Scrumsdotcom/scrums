// cac migrate: move instance documents to the current document format.
//
// Run with the CLI of the release you are moving to, after `cac upgrade` has
// replaced the framework files. Only documents this instance owns are
// touched: everything under company/, the instance's own hub modules, and
// cac.yaml. Framework files arrive already migrated from upstream.

import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import { REPO_ROOT } from "./paths.js";
import { INSTANCE_FILE, loadInstance } from "./boundary.js";
import { MIGRATIONS, type Migration } from "./migrations/index.js";
import { API_VERSION } from "./version.js";

const API_VERSION_LINE = /^apiVersion:\s*["']?([^\s"'#]+)["']?\s*(#.*)?$/m;

export function apiVersionOf(text: string): string | null {
  return API_VERSION_LINE.exec(text)?.[1] ?? null;
}

export interface MigrationStep {
  file: string;
  from: string;
  to: string;
  applied: string[];
  /** Set when no chain of migrations reaches the target version. */
  stuck?: string;
}

/** The ordered chain of migrations from `from` to `to`, or null if none exists. */
export function chain(from: string, to: string, migrations: Migration[]): Migration[] | null {
  const out: Migration[] = [];
  let at = from;
  const seen = new Set<string>();
  while (at !== to) {
    if (seen.has(at)) return null;
    seen.add(at);
    const step = migrations.find((m) => m.from === at);
    if (!step) return null;
    out.push(step);
    at = step.to;
  }
  return out;
}

async function instanceDocuments(root: string): Promise<string[]> {
  const instance = await loadInstance(root);
  const patterns = ["company/**/*.yaml", "company/**/*.yml"];
  if (instance?.role === "fork") {
    patterns.push(`hub/modules/${instance.namespace}-*/**/*.yaml`, `hub/modules/${instance.namespace}-*/**/*.yml`);
  } else {
    // Upstream owns every hub module, and migrates them like the rest of its tree.
    patterns.push("hub/modules/**/*.yaml", "hub/modules/**/*.yml");
  }
  const files = await fg(patterns, { cwd: root, dot: true, ignore: ["**/node_modules/**"] });
  try {
    await fs.access(path.join(root, INSTANCE_FILE));
    files.push(INSTANCE_FILE);
  } catch {
    // no cac.yaml: nothing to add
  }
  return files.map((f) => f.split(path.sep).join("/")).sort();
}

export async function planMigration(
  root: string,
  target: string = API_VERSION,
  migrations: Migration[] = MIGRATIONS,
): Promise<{ steps: MigrationStep[]; output: Map<string, string> }> {
  const steps: MigrationStep[] = [];
  const output = new Map<string, string>();
  for (const file of await instanceDocuments(root)) {
    const text = await fs.readFile(path.join(root, file), "utf8");
    const from = apiVersionOf(text);
    if (from === null || from === target) continue;
    const path_ = chain(from, target, migrations);
    if (!path_) {
      steps.push({ file, from, to: target, applied: [], stuck: `no migration path from ${from} to ${target}` });
      continue;
    }
    let next = text;
    for (const m of path_) next = m.apply(next);
    steps.push({ file, from, to: target, applied: path_.map((m) => m.id) });
    output.set(file, next);
  }
  return { steps, output };
}

export async function migrateCommand(opts: { write: boolean }, root: string = REPO_ROOT): Promise<boolean> {
  const { steps, output } = await planMigration(root);
  const stuck = steps.filter((s) => s.stuck);
  if (steps.length === 0) {
    console.log(`✓ migrate: every instance document is already ${API_VERSION}.`);
    return true;
  }
  const byMigration = new Map<string, number>();
  for (const s of steps) for (const id of s.applied) byMigration.set(id, (byMigration.get(id) ?? 0) + 1);
  for (const m of MIGRATIONS) {
    const n = byMigration.get(m.id);
    if (n) console.log(`  migration ${m.id} (${m.from} → ${m.to}): ${m.summary} [${n} file(s)]`);
  }
  for (const s of stuck) console.error(`  ✗ ${s.file}: ${s.stuck}`);
  console.log(`\n${output.size} document(s) to migrate to ${API_VERSION}${opts.write ? "" : " (dry-run)"}.`);
  for (const file of output.keys()) console.log(`  - ${file}`);

  if (stuck.length > 0) {
    console.error(`\n✗ migrate: ${stuck.length} document(s) have no migration path. Nothing written.`);
    return false;
  }
  if (!opts.write) {
    console.log("\nNothing written. Re-run with --write to apply, then run 'npm run validate'.");
    return true;
  }
  for (const [file, text] of output) await fs.writeFile(path.join(root, file), text, "utf8");
  console.log(`\n✓ migrate: ${output.size} document(s) now declare ${API_VERSION}. Run 'npm run generate && npm run validate'.`);
  return true;
}
