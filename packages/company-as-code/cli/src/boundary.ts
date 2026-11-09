// The framework/instance boundary.
//
// A fork owns its company. It does not own the framework it runs on, in the
// same way an application owns its code but not its compiler. When those two
// are mixed in one tree with nothing marking the line, every upstream release
// arrives as a merge conflict, and forks quietly stop taking releases.
//
// This module draws the line. Every path in the repository belongs to exactly
// one class:
//
//   framework  shipped by upstream, replaced wholesale on upgrade
//   adapt      shipped by upstream as a starting point, then edited by the fork;
//              upgrades report upstream changes but never overwrite
//   instance   owned by the fork, never touched by an upgrade
//   derived    regenerated from sources; never edited by hand
//
// Upstream records a hash of every framework and adapt file in
// framework.lock.json. A fork keeps that lock as the record of which framework
// release it is on, which is what lets `cac boundary check` say exactly what a
// fork changed and `cac upgrade` say exactly what upstream changed.

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import YAML from "yaml";
import { REPO_ROOT } from "./paths.js";
import { API_VERSION } from "./version.js";

export type PathClass = "framework" | "adapt" | "instance" | "derived";

/**
 * Patterns are either an exact repo-relative file path or a directory prefix
 * ending in `/**`. Nothing richer is supported, on purpose: a boundary that
 * needs a glob engine to read is a boundary nobody can check by eye.
 *
 * Order matters only for overlapping patterns; the first class that matches
 * wins, in the order derived, instance, adapt, framework.
 */
export const BOUNDARY: Record<PathClass, string[]> = {
  derived: ["generated/**", "framework.lock.json"],
  instance: [
    "company/**",
    "cac.yaml",
    "docs/governance/**",
    "CHANGELOG.md",
    "CITATION.cff",
    "CODE_OF_CONDUCT.md",
    "CONTRIBUTING.md",
    "GOVERNANCE.md",
    "MAINTAINERS.md",
    "NOTICE",
    "SECURITY.md",
    "SUPPORT.md",
  ],
  adapt: [".github/**", ".gitignore", "AGENTS.md", "README.md"],
  framework: [
    "cli/**",
    "conformance/**",
    "docs/**",
    "hub/**",
    "runtime/**",
    "schemas/**",
    "templates/**",
    ".editorconfig",
    ".gitattributes",
    "LICENSE",
    "package.json",
  ],
};

const CLASS_ORDER: PathClass[] = ["derived", "instance", "adapt", "framework"];

/** Never part of the boundary: local build output, dependencies, scratch. */
const IGNORE = [
  ".git/**",
  ".branch-workspace/**",
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/coverage/**",
  "**/.nyc_output/**",
  "**/*.tsbuildinfo",
  "**/*.log",
  "**/runtime.db*",
  "**/.DS_Store",
];

export const INSTANCE_FILE = "cac.yaml";
export const LOCK_FILE = "framework.lock.json";

export const NAMESPACE_PATTERN = /^[a-z][a-z0-9]{1,15}$/;

export interface Deviation {
  path: string;
  reason: string;
  decision?: string;
}

export interface InstanceConfig {
  apiVersion: string;
  kind: "Instance";
  name: string;
  role: "upstream" | "fork";
  namespace: string;
  framework: { version: string; upstream?: string };
  deviations?: Deviation[];
}

export interface FrameworkLock {
  apiVersion: string;
  kind: "FrameworkLock";
  frameworkVersion: string;
  boundary: Record<PathClass, string[]>;
  files: { framework: Record<string, string>; adapt: Record<string, string> };
}

function matches(pattern: string, file: string): boolean {
  if (pattern.endsWith("/**")) return file.startsWith(pattern.slice(0, -2));
  return file === pattern;
}

/**
 * A fork's own hub modules live beside upstream's, so the directory alone
 * cannot say who owns them. The namespace prefix can: `hub/modules/acme-*` is
 * Acme's, everything else under `hub/` came from upstream.
 */
function forkHubModule(file: string, instance: InstanceConfig | null): boolean {
  if (!instance || instance.role !== "fork") return false;
  return file.startsWith(`hub/modules/${instance.namespace}-`);
}

export function classify(
  file: string,
  instance: InstanceConfig | null,
  boundary: Record<PathClass, string[]> = BOUNDARY,
): PathClass | null {
  if (forkHubModule(file, instance)) return "instance";
  for (const cls of CLASS_ORDER) {
    if (boundary[cls].some((p) => matches(p, file))) return cls;
  }
  return null;
}

export async function loadInstance(root: string = REPO_ROOT): Promise<InstanceConfig | null> {
  let text: string;
  try {
    text = await fs.readFile(path.join(root, INSTANCE_FILE), "utf8");
  } catch {
    return null;
  }
  return YAML.parse(text) as InstanceConfig;
}

export async function loadLock(root: string = REPO_ROOT): Promise<FrameworkLock | null> {
  let text: string;
  try {
    text = await fs.readFile(path.join(root, LOCK_FILE), "utf8");
  } catch {
    return null;
  }
  return JSON.parse(text) as FrameworkLock;
}

export async function listFiles(root: string = REPO_ROOT): Promise<string[]> {
  const files = await fg("**/*", { cwd: root, dot: true, ignore: IGNORE, onlyFiles: true });
  return files.map((f) => f.split(path.sep).join("/")).sort();
}

export async function hashFile(absolute: string): Promise<string> {
  const bytes = await fs.readFile(absolute);
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

async function frameworkVersion(root: string): Promise<string> {
  const pkg = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
  return String(pkg.version);
}

/** The lock upstream would publish for the tree at `root`. */
export async function computeLock(
  root: string = REPO_ROOT,
  instance: InstanceConfig | null = null,
): Promise<FrameworkLock> {
  const files = await listFiles(root);
  const framework: Record<string, string> = {};
  const adapt: Record<string, string> = {};
  for (const f of files) {
    const cls = classify(f, instance);
    if (cls === "framework") framework[f] = await hashFile(path.join(root, f));
    else if (cls === "adapt") adapt[f] = await hashFile(path.join(root, f));
  }
  return {
    apiVersion: API_VERSION,
    kind: "FrameworkLock",
    frameworkVersion: await frameworkVersion(root),
    boundary: BOUNDARY,
    files: { framework, adapt },
  };
}

export function serializeLock(lock: FrameworkLock): string {
  return JSON.stringify(lock, null, 2) + "\n";
}

// --- Checking a tree against its boundary ---------------------------------

export type FindingKind =
  | "modified"
  | "missing"
  | "added"
  | "unclassified"
  | "lock-stale"
  | "no-lock"
  | "no-instance"
  | "bad-namespace";

export interface BoundaryFinding {
  kind: FindingKind;
  path: string;
  message: string;
  /** True when the fork declared this deviation in cac.yaml. Declared deviations are reported, not failed. */
  declared: boolean;
}

export interface BoundaryReport {
  role: "upstream" | "fork" | null;
  findings: BoundaryFinding[];
}

function addedHint(file: string, instance: InstanceConfig): string {
  if (file.startsWith("docs/adr/")) {
    return "docs/adr/ holds upstream's decisions, and upstream numbering will collide with yours. Record fork decisions in company/decisions/ instead.";
  }
  if (file.startsWith("hub/modules/")) {
    return `hub modules authored by this fork must be named '${instance.namespace}-<name>' so they never collide with an upstream module of the same name.`;
  }
  return "this path belongs to the framework, so the next upgrade will not know about it. Move it under company/, or declare it as a deviation in cac.yaml.";
}

export async function checkBoundary(root: string = REPO_ROOT): Promise<BoundaryReport> {
  const instance = await loadInstance(root);
  if (!instance) {
    return {
      role: null,
      findings: [
        {
          kind: "no-instance",
          path: INSTANCE_FILE,
          message: "no cac.yaml. Nothing declares whether this tree is upstream or a fork. Run 'cac init' in a fork.",
          declared: false,
        },
      ],
    };
  }

  const findings: BoundaryFinding[] = [];
  if (!NAMESPACE_PATTERN.test(instance.namespace ?? "")) {
    findings.push({
      kind: "bad-namespace",
      path: INSTANCE_FILE,
      message: `namespace '${instance.namespace}' must be 2-16 lowercase letters or digits, starting with a letter.`,
      declared: false,
    });
  }

  const files = await listFiles(root);
  for (const f of files) {
    if (classify(f, instance) === null) {
      findings.push({
        kind: "unclassified",
        path: f,
        message: "belongs to no boundary class, so no upgrade can reason about it. Add it to BOUNDARY in cli/src/boundary.ts (upstream) or move it under company/ (fork).",
        declared: false,
      });
    }
  }

  if (instance.role === "upstream") {
    const expected = serializeLock(await computeLock(root, instance));
    let current: string | null = null;
    try {
      current = await fs.readFile(path.join(root, LOCK_FILE), "utf8");
    } catch {
      current = null;
    }
    if (current !== expected) {
      findings.push({
        kind: current === null ? "no-lock" : "lock-stale",
        path: LOCK_FILE,
        message: "does not match the framework files. Run 'npm run generate' and commit the result.",
        declared: false,
      });
    }
    return { role: "upstream", findings };
  }

  const lock = await loadLock(root);
  if (!lock) {
    findings.push({
      kind: "no-lock",
      path: LOCK_FILE,
      message: "no framework.lock.json. A fork without the lock cannot tell its own edits from upstream's. Restore it from the upstream release you forked.",
      declared: false,
    });
    return { role: "fork", findings };
  }

  const declared = new Set((instance.deviations ?? []).map((d) => d.path));
  const present = new Set(files);
  for (const [file, hash] of Object.entries(lock.files.framework)) {
    if (!present.has(file)) {
      findings.push({
        kind: "missing",
        path: file,
        message: "framework file deleted in this fork.",
        declared: declared.has(file),
      });
      continue;
    }
    if ((await hashFile(path.join(root, file))) !== hash) {
      findings.push({
        kind: "modified",
        path: file,
        message: "framework file edited in this fork. The next upgrade will stop at this file.",
        declared: declared.has(file),
      });
    }
  }
  for (const f of files) {
    if (classify(f, instance) === "framework" && !(f in lock.files.framework)) {
      findings.push({ kind: "added", path: f, message: addedHint(f, instance), declared: declared.has(f) });
    }
  }
  findings.sort((a, b) => a.path.localeCompare(b.path));
  return { role: "fork", findings };
}

export function failing(report: BoundaryReport): BoundaryFinding[] {
  return report.findings.filter((f) => !f.declared);
}

// --- Commands --------------------------------------------------------------

export async function boundaryCheckCommand(root: string = REPO_ROOT): Promise<boolean> {
  const report = await checkBoundary(root);
  const fails = failing(report);
  const declared = report.findings.filter((f) => f.declared);
  for (const f of declared) console.log(`  [declared] [${f.kind}] ${f.path}`);
  if (fails.length === 0) {
    console.log(
      `✓ boundary: ${report.role} tree is clean${declared.length ? ` (${declared.length} declared deviation(s))` : ""}.`,
    );
    return true;
  }
  console.error(`✗ boundary: ${fails.length} problem(s) in a ${report.role ?? "undeclared"} tree:`);
  for (const f of fails) console.error(`  - [${f.kind}] ${f.path}: ${f.message}`);
  return false;
}

export async function boundaryExplainCommand(file: string, root: string = REPO_ROOT): Promise<boolean> {
  const instance = await loadInstance(root);
  const rel = file.replace(/^\.\//, "");
  const cls = classify(rel, instance);
  const meaning: Record<PathClass, string> = {
    framework: "shipped by upstream and replaced on upgrade. Edit it in a fork only as a declared deviation.",
    adapt: "shipped by upstream as a starting point. Edit freely; upgrades report upstream changes but never overwrite.",
    instance: "owned by this instance. Upgrades never touch it.",
    derived: "regenerated from sources. Never edit by hand.",
  };
  if (!cls) {
    console.log(`${rel}: unclassified. Add it to BOUNDARY in cli/src/boundary.ts or move it under company/.`);
    return false;
  }
  console.log(`${rel}: ${cls}, ${meaning[cls]}`);
  return true;
}

export interface InitOptions {
  name: string;
  namespace: string;
  write: boolean;
}

/**
 * Turn a fresh copy of upstream into a declared fork. The only file written is
 * cac.yaml: the framework pin is carried over from upstream's, so the fork
 * starts out knowing exactly which release it came from.
 */
export async function initCommand(opts: InitOptions, root: string = REPO_ROOT): Promise<boolean> {
  if (!NAMESPACE_PATTERN.test(opts.namespace)) {
    console.error(`✗ init: namespace '${opts.namespace}' must be 2-16 lowercase letters or digits, starting with a letter.`);
    return false;
  }
  const current = await loadInstance(root);
  if (current?.role === "fork") {
    console.error(`✗ init: this tree is already the fork '${current.name}' (namespace ${current.namespace}).`);
    return false;
  }
  const lock = await loadLock(root);
  const next: InstanceConfig = {
    apiVersion: API_VERSION,
    kind: "Instance",
    name: opts.name,
    role: "fork",
    namespace: opts.namespace,
    framework: {
      version: lock?.frameworkVersion ?? current?.framework.version ?? "0.0.0",
      ...(current?.framework.upstream ? { upstream: current.framework.upstream } : {}),
    },
    deviations: [],
  };
  const text = instanceYaml(next);
  if (!opts.write) {
    console.log(`(dry-run) would write ${INSTANCE_FILE}:\n`);
    console.log(text);
    console.log("Re-run with --write to apply.");
    return true;
  }
  await fs.writeFile(path.join(root, INSTANCE_FILE), text, "utf8");
  console.log(`✓ init: wrote ${INSTANCE_FILE} for fork '${opts.name}' (namespace ${opts.namespace}).`);
  console.log("Next: replace the worked examples under company/ with your own, then run 'cac boundary check'.");
  return true;
}

export function instanceYaml(instance: InstanceConfig): string {
  const header = [
    "# What this repository is, for the tools that need to know.",
    "#",
    "# role: upstream is the Company-as-Code project itself. role: fork is a",
    "# company running on it. See docs/standards/framework-boundary.md.",
    "",
  ].join("\n");
  return header + YAML.stringify(instance);
}
