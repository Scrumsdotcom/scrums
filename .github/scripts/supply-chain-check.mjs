#!/usr/bin/env node
// Repository supply-chain policy check.
//
//   node .github/scripts/supply-chain-check.mjs [ROOT]
//
// Exits 1 and prints one line per finding when the repository breaks a rule:
//
// Workflows (.github/workflows/*.yml)
//   - Every remote `uses:` is pinned to a full commit SHA with a version comment.
//   - No `pull_request_target` or `workflow_run` trigger.
//   - Each workflow declares top-level `permissions:`.
//   - Each actions/checkout step sets `persist-credentials: false`.
//   - No dependency caches (`actions/cache`, `cache:` on setup actions).
//   - npm installs are `npm ci --ignore-scripts`. No `npm install`, `npx` or
//     `npm exec`, which can fetch unpinned code at run time.
//
// npm lockfiles
//   - Every package.json that declares dependencies has a sibling
//     package-lock.json.
//   - Every installed package resolves from https://registry.npmjs.org/ and
//     carries a sha512 integrity hash. Git, tarball-URL and other registry
//     sources are refused.
//   - Only allowlisted packages have install scripts.
//   - No package version on .github/supply-chain/compromised-npm.txt.
//
// Files that run code on their own
//   - No editor or agent configuration that runs commands when a folder opens
//     or an agent starts (.vscode/tasks.json, .claude/settings*.json, script
//     files in .vscode/ or .claude/).
//   - The documentation site runs every .js file under docs/ on every page.
//     Only the files in DOCS_SCRIPTS may exist.
//
// The script uses Node.js built-ins only, so the check itself installs nothing.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Packages that may run install scripts, with the reason.
export const INSTALL_SCRIPT_ALLOWLIST = new Map([
  ["better-sqlite3", "builds its native addon"],
  ["esbuild", "selects its platform binary"],
  ["fsevents", "macOS native addon, optional"],
]);

// Script files that the documentation site may load on every page.
export const DOCS_SCRIPTS = new Set(["docs/footer-tagline.js"]);

// Directories that the walk skips.
const SKIP_DIRS = new Set([".git", "node_modules", "dist", "dist-release"]);

// Workflow directories that do not run in this repository.
// packages/company-as-code/.github/ belongs to the upstream project.
const WORKFLOW_DIRS = [".github/workflows"];

const SHA_PIN = /^[^@\s]+@[0-9a-f]{40}$/;

function toPosix(p) {
  return p.split(sep).join("/");
}

export function walk(root, dir = root, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full, { throwIfNoEntry: false });
    if (!st) continue;
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(root, full, out);
    } else if (st.isFile()) {
      out.push(toPosix(relative(root, full)));
    }
  }
  return out;
}

function stripComment(line) {
  // A YAML comment starts with " #" outside quotes. The workflows here do not
  // put " #" inside quoted strings on the lines this check reads.
  const i = line.search(/\s#/);
  return i === -1 ? line : line.slice(0, i);
}

// Returns the steps of a workflow as arrays of lines. A step starts at a line
// "- " and ends before the next line at the same or a lower indent.
function stepsOf(lines) {
  const steps = [];
  let cur = null;
  let indent = -1;
  for (const line of lines) {
    const m = /^(\s*)- /.exec(line);
    const lead = /^(\s*)/.exec(line)[1].length;
    if (m && cur && m[1].length <= indent) {
      steps.push(cur);
      cur = null;
    } else if (cur && line.trim() && lead <= indent) {
      steps.push(cur);
      cur = null;
    }
    if (m && !cur && (/^\s*- uses:/.test(line) || /^\s*- name:/.test(line) || /^\s*- run:/.test(line))) {
      cur = [line];
      indent = m[1].length;
    } else if (cur) {
      cur.push(line);
    }
  }
  if (cur) steps.push(cur);
  return steps;
}

export function checkWorkflow(file, text) {
  const findings = [];
  const lines = text.split(/\r?\n/);
  const add = (n, msg) => findings.push(`${file}:${n}: ${msg}`);

  if (!lines.some((l) => /^permissions:/.test(l))) add(1, "declare top-level permissions (for example `permissions: {}` or `contents: read`)");

  lines.forEach((raw, i) => {
    const n = i + 1;
    const line = stripComment(raw);
    if (/^\s*(pull_request_target|workflow_run)\s*:/.test(line) || /^\s*-\s*(pull_request_target|workflow_run)\s*$/.test(line) || /^on:\s*\[?.*\b(pull_request_target|workflow_run)\b/.test(line)) {
      add(n, "pull_request_target and workflow_run run with repository credentials on untrusted input; use pull_request");
    }
    const u = /^\s*(?:-\s*)?uses:\s*["']?([^"'\s]+)["']?/.exec(line);
    if (u) {
      const ref = u[1];
      if (!ref.startsWith("./") && !ref.startsWith("docker://")) {
        if (!SHA_PIN.test(ref)) add(n, `pin ${ref} to a full commit SHA`);
        else if (!/#\s*v?\d/.test(raw)) add(n, `add the version comment after the SHA of ${ref.split("@")[0]} (for example # v1.2.3)`);
        if (/^actions\/cache(\/|@)/.test(ref)) add(n, "do not use actions/cache: a cache written by one run can poison a later privileged run");
      } else if (ref.startsWith("docker://") && !/@sha256:[0-9a-f]{64}$/.test(ref)) {
        add(n, `pin ${ref} to an image digest`);
      }
    }
    if (/^\s*cache(-dependency-path)?\s*:/.test(line)) add(n, "do not enable dependency caches in setup actions");
    if (/\bnpm\s+(install|i|add)\b/.test(line)) add(n, "install dependencies with `npm ci --ignore-scripts`, not npm install");
    if ((/\bnpx\s/.test(line) || /\bnpm\s+(exec|x)\b/.test(line)) && !/(\bnpx|\bnpm\s+(exec|x))\s+(--no-install|--no)\b/.test(line)) {
      add(n, "run local binaries with `npx --no-install`; npx can otherwise download and run unpinned code");
    }
    if (/\bnpm\s+ci\b/.test(line) && !/--ignore-scripts\b/.test(line)) add(n, "add --ignore-scripts to npm ci");
  });

  for (const step of stepsOf(lines)) {
    if (step.some((l) => /uses:\s*actions\/checkout@/.test(l)) && !step.some((l) => /^\s*persist-credentials:\s*false\b/.test(l))) {
      const n = lines.indexOf(step[0]) + 1;
      add(n, "set `persist-credentials: false` on actions/checkout");
    }
  }
  return findings;
}

export function parseDenylist(text) {
  const exact = new Set();
  const names = new Set();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    if (!line) continue;
    const at = line.lastIndexOf("@");
    if (at > 0) exact.add(line);
    else names.add(line);
  }
  return { exact, names };
}

// The package name of a lockfile key such as "node_modules/a/node_modules/@s/b".
export function nameOfKey(key) {
  const i = key.lastIndexOf("node_modules/");
  return i === -1 ? undefined : key.slice(i + "node_modules/".length);
}

export function checkLockfile(file, lock, deny) {
  const findings = [];
  const add = (msg) => findings.push(`${file}: ${msg}`);
  if (typeof lock !== "object" || lock === null || typeof lock.packages !== "object" || lock.packages === null) {
    add("expected lockfileVersion 2 or 3 with a `packages` map");
    return findings;
  }
  for (const [key, meta] of Object.entries(lock.packages)) {
    const name = nameOfKey(key);
    if (name === undefined || typeof meta !== "object" || meta === null) continue; // the root or a local folder
    if (meta.link === true) continue; // a symlink to a folder in this repository
    const id = `${name}@${meta.version ?? "?"}`;
    if (deny.exact.has(id) || deny.names.has(name)) add(`${id} is a known-malicious version (.github/supply-chain/compromised-npm.txt)`);
    if (typeof meta.resolved !== "string" || !meta.resolved.startsWith("https://registry.npmjs.org/")) {
      add(`${id} resolves from ${JSON.stringify(meta.resolved ?? null)}; only https://registry.npmjs.org/ is allowed`);
    }
    if (typeof meta.integrity !== "string" || !meta.integrity.startsWith("sha512-")) add(`${id} has no sha512 integrity hash`);
    if (meta.hasInstallScript === true && !INSTALL_SCRIPT_ALLOWLIST.has(name)) {
      add(`${id} has an install script; review it and add it to INSTALL_SCRIPT_ALLOWLIST in .github/scripts/supply-chain-check.mjs`);
    }
  }
  return findings;
}

const AUTORUN = [
  [/(^|\/)\.vscode\/tasks\.json$/, "VS Code tasks can run when a folder opens"],
  [/(^|\/)\.vscode\/.*\.(c|m)?(j|t)s$/, "script files in .vscode/ run from editor configuration"],
  [/(^|\/)\.claude\/settings(\.local)?\.json$/, "agent settings can register hooks that run commands"],
  [/(^|\/)\.claude\/.*\.(c|m)?(j|t)s$/, "script files in .claude/ run from agent hooks"],
];

function declaresDependencies(pkg) {
  return ["dependencies", "devDependencies", "optionalDependencies"].some(
    (k) => pkg && typeof pkg[k] === "object" && pkg[k] !== null && Object.keys(pkg[k]).length > 0,
  );
}

// readJson(file) returns the parsed package.json, or undefined.
export function checkFiles(files, readJson = () => ({ dependencies: { any: "*" } })) {
  const findings = [];
  const set = new Set(files);
  for (const f of files) {
    for (const [re, why] of AUTORUN) if (re.test(f)) findings.push(`${f}: remove it; ${why}`);
    if (/^docs\/.*\.(c|m)?js$/.test(f) && !DOCS_SCRIPTS.has(f)) {
      findings.push(`${f}: the docs site runs every .js file on every page; add it to DOCS_SCRIPTS in .github/scripts/supply-chain-check.mjs only after review`);
    }
    if (f.endsWith("/package.json") || f === "package.json") {
      const dir = f.slice(0, -"package.json".length);
      if (!set.has(`${dir}package-lock.json`) && declaresDependencies(readJson(f))) findings.push(`${f}: commit a package-lock.json next to it`);
    }
  }
  return findings;
}

export function run(root) {
  const files = walk(root);
  const findings = [];
  const deny = parseDenylist(readFileSync(join(root, ".github/supply-chain/compromised-npm.txt"), "utf8"));
  for (const f of files) {
    if (WORKFLOW_DIRS.some((d) => f.startsWith(`${d}/`)) && /\.ya?ml$/.test(f)) {
      findings.push(...checkWorkflow(f, readFileSync(join(root, f), "utf8")));
    }
    if (f.endsWith("package-lock.json")) {
      let lock;
      try {
        lock = JSON.parse(readFileSync(join(root, f), "utf8"));
      } catch {
        findings.push(`${f}: not valid JSON`);
        continue;
      }
      findings.push(...checkLockfile(f, lock, deny));
    }
  }
  const readJson = (f) => {
    try {
      return JSON.parse(readFileSync(join(root, f), "utf8"));
    } catch {
      return { dependencies: { unreadable: "*" } };
    }
  };
  findings.push(...checkFiles(files, readJson));
  return findings;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = process.argv[2] ?? join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
  const findings = run(root);
  for (const f of findings) process.stdout.write(`${f}\n`);
  if (findings.length) {
    process.stdout.write(`\n${findings.length} supply-chain finding(s).\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write("supply-chain check: no findings\n");
  }
}
