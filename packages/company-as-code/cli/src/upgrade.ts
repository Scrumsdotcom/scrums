// cac upgrade: take a new framework release without merging it.
//
// Three hashes decide what happens to every framework file:
//
//   base     what the fork received, from its own framework.lock.json
//   next     what upstream ships now, from the new release's lock
//   current  what is on disk in the fork today
//
// If the fork never touched a file (current == base), upstream's version
// replaces it. If the fork touched it, the upgrade stops at that file and
// says why. Nothing is merged line by line; a fork that wants a different
// framework file carries it as a declared deviation and resolves it by hand.
//
// Documents under company/ are never copied. Their shape is moved forward
// afterwards by `cac migrate`, run with the new CLI.

import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { REPO_ROOT } from "./paths.js";
import {
  INSTANCE_FILE,
  LOCK_FILE,
  hashFile,
  loadInstance,
  loadLock,
  type FrameworkLock,
} from "./boundary.js";

export type ActionKind =
  | "update"
  | "add"
  | "remove"
  | "already-current"
  | "keep-local"
  | "conflict"
  | "review-adapt";

export interface UpgradeAction {
  kind: ActionKind;
  path: string;
  reason: string;
}

export interface UpgradePlan {
  from: string;
  to: string;
  actions: UpgradeAction[];
}

async function currentHash(root: string, file: string): Promise<string | null> {
  try {
    return await hashFile(path.join(root, file));
  } catch {
    return null;
  }
}

/** Compare dotted numeric versions; pre-release suffixes compare as equal. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split("-")[0]!.split(".").map(Number);
  const pb = b.split("-")[0]!.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return Math.sign(d);
  }
  return 0;
}

export async function planUpgrade(
  root: string,
  base: FrameworkLock,
  next: FrameworkLock,
  declared: Set<string> = new Set(),
): Promise<UpgradePlan> {
  const actions: UpgradeAction[] = [];
  const paths = new Set([...Object.keys(base.files.framework), ...Object.keys(next.files.framework)]);

  for (const file of [...paths].sort()) {
    const b = base.files.framework[file];
    const n = next.files.framework[file];
    const c = await currentHash(root, file);
    const note = declared.has(file) ? " (declared deviation)" : "";

    if (n === undefined) {
      if (c === null) continue;
      if (c === b) actions.push({ kind: "remove", path: file, reason: "removed upstream" });
      else actions.push({ kind: "conflict", path: file, reason: `removed upstream, but changed in this fork${note}` });
      continue;
    }
    if (b === undefined) {
      if (c === null) actions.push({ kind: "add", path: file, reason: "new upstream" });
      else if (c === n) actions.push({ kind: "already-current", path: file, reason: "already matches upstream" });
      else actions.push({ kind: "conflict", path: file, reason: `new upstream, but a different file already exists here${note}` });
      continue;
    }
    if (b === n) {
      if (c !== b) actions.push({ kind: "keep-local", path: file, reason: `unchanged upstream; keeping this fork's version${note}` });
      continue;
    }
    if (c === b) actions.push({ kind: "update", path: file, reason: "changed upstream" });
    else if (c === n) actions.push({ kind: "already-current", path: file, reason: "already matches upstream" });
    else if (c === null) actions.push({ kind: "conflict", path: file, reason: `changed upstream, but deleted in this fork${note}` });
    else actions.push({ kind: "conflict", path: file, reason: `changed upstream and in this fork${note}` });
  }

  const adapt = new Set([...Object.keys(base.files.adapt), ...Object.keys(next.files.adapt)]);
  for (const file of [...adapt].sort()) {
    if (base.files.adapt[file] !== next.files.adapt[file]) {
      actions.push({
        kind: "review-adapt",
        path: file,
        reason: next.files.adapt[file] === undefined ? "removed upstream; decide whether to keep yours" : "changed upstream; compare and carry over what you want",
      });
    }
  }

  return { from: base.frameworkVersion, to: next.frameworkVersion, actions };
}

export async function applyUpgrade(root: string, upstreamRoot: string, plan: UpgradePlan): Promise<void> {
  for (const a of plan.actions) {
    const target = path.join(root, a.path);
    if (a.kind === "update" || a.kind === "add") {
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.copyFile(path.join(upstreamRoot, a.path), target);
    } else if (a.kind === "remove") {
      await fs.rm(target, { force: true });
    }
  }
  await fs.copyFile(path.join(upstreamRoot, LOCK_FILE), path.join(root, LOCK_FILE));

  // Edit cac.yaml as a document, not a re-serialised object, so the fork's
  // comments and ordering survive.
  const instancePath = path.join(root, INSTANCE_FILE);
  const doc = YAML.parseDocument(await fs.readFile(instancePath, "utf8"));
  doc.setIn(["framework", "version"], plan.to);
  await fs.writeFile(instancePath, doc.toString(), "utf8");
}

export interface UpgradeOptions {
  from: string;
  write: boolean;
  allowConflicts: boolean;
}

const LABEL: Record<ActionKind, string> = {
  update: "update",
  add: "add",
  remove: "remove",
  "already-current": "current",
  "keep-local": "keep",
  conflict: "CONFLICT",
  "review-adapt": "review",
};

export async function upgradeCommand(opts: UpgradeOptions, root: string = REPO_ROOT): Promise<boolean> {
  const upstreamRoot = path.resolve(opts.from);
  const instance = await loadInstance(root);
  if (instance?.role !== "fork") {
    console.error("✗ upgrade: this tree is not a declared fork. Upstream publishes releases; it does not upgrade from them. Run 'cac init' in a fork.");
    return false;
  }
  const base = await loadLock(root);
  if (!base) {
    console.error(`✗ upgrade: no ${LOCK_FILE} here, so there is nothing to tell this fork's edits apart from upstream's. Restore the lock from the release you forked.`);
    return false;
  }
  const next = await loadLock(upstreamRoot);
  const upstreamInstance = await loadInstance(upstreamRoot);
  if (!next) {
    console.error(`✗ upgrade: ${upstreamRoot} has no ${LOCK_FILE}. Point --from at a checkout of an upstream release.`);
    return false;
  }
  if (upstreamInstance && upstreamInstance.role !== "upstream") {
    console.error(`✗ upgrade: ${upstreamRoot} is a fork ('${upstreamInstance.name}'), not upstream.`);
    return false;
  }
  if (compareVersions(next.frameworkVersion, base.frameworkVersion) < 0) {
    console.error(`✗ upgrade: ${upstreamRoot} is ${next.frameworkVersion}, older than this fork's ${base.frameworkVersion}. Downgrades are not supported.`);
    return false;
  }

  const declared = new Set((instance.deviations ?? []).map((d) => d.path));
  const plan = await planUpgrade(root, base, next, declared);
  const visible = plan.actions.filter((a) => a.kind !== "already-current");
  const conflicts = plan.actions.filter((a) => a.kind === "conflict");

  console.log(`Framework ${plan.from} → ${plan.to}${opts.write ? "" : " (dry-run)"}`);
  if (visible.length === 0) console.log("  nothing to change.");
  for (const a of visible) console.log(`  [${LABEL[a.kind]}] ${a.path}: ${a.reason}`);

  const counts = Object.fromEntries(
    (Object.keys(LABEL) as ActionKind[]).map((k) => [k, plan.actions.filter((a) => a.kind === k).length]),
  );
  console.log(
    `\n${counts.update} update, ${counts.add} add, ${counts.remove} remove, ${counts.conflict} conflict, ${counts["review-adapt"]} to review, ${counts["keep-local"]} kept local.`,
  );

  if (!opts.write) {
    console.log("\nNothing written. Re-run with --write to apply.");
    return conflicts.length === 0;
  }
  if (conflicts.length > 0 && !opts.allowConflicts) {
    console.error(
      `\n✗ upgrade: ${conflicts.length} conflict(s). Resolve each one (take upstream's file, or declare a deviation in cac.yaml), or re-run with --allow-conflicts to apply everything else and leave the conflicted files as they are.`,
    );
    return false;
  }

  await applyUpgrade(root, upstreamRoot, plan);
  console.log(`\n✓ upgrade: framework files and ${LOCK_FILE} now match ${plan.to}.`);
  console.log("Next, in order:");
  console.log("  1. npm --prefix cli install && npm --prefix runtime install");
  console.log("  2. npx tsx cli/src/index.ts migrate          (preview document changes)");
  console.log("  3. npx tsx cli/src/index.ts migrate --write  (apply them)");
  console.log("  4. npm run generate && npm run validate && npm test");
  console.log("  5. npm run boundary                          (anything left is a conflict to resolve)");
  return true;
}
