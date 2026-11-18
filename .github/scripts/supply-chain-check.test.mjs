// node --test .github/scripts/supply-chain-check.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkFiles, checkLockfile, checkWorkflow, nameOfKey, parseDenylist } from "./supply-chain-check.mjs";

const SHA = "3d3c42e5aac5ba805825da76410c181273ba90b1";

const wf = (body) => `name: t\non:\n  pull_request:\npermissions:\n  contents: read\njobs:\n  a:\n    runs-on: ubuntu-latest\n    steps:\n${body}`;

test("a pinned, credential-free workflow passes", () => {
  const text = wf(`      - uses: actions/checkout@${SHA} # v7.0.1\n        with:\n          persist-credentials: false\n      - run: npm ci --ignore-scripts\n      - run: npx --no-install tsc\n`);
  assert.deepEqual(checkWorkflow("w.yml", text), []);
});

test("tags, branches and short SHAs are refused", () => {
  for (const ref of ["actions/setup-node@v4", "actions/setup-node@main", "actions/setup-node@3d3c42e"]) {
    const f = checkWorkflow("w.yml", wf(`      - uses: ${ref}\n`));
    assert.ok(f.some((x) => x.includes("full commit SHA")), ref);
  }
});

test("a SHA pin needs a version comment", () => {
  const f = checkWorkflow("w.yml", wf(`      - uses: actions/setup-node@${SHA}\n`));
  assert.ok(f.some((x) => x.includes("version comment")));
});

test("checkout without persist-credentials: false is refused", () => {
  const f = checkWorkflow("w.yml", wf(`      - uses: actions/checkout@${SHA} # v7.0.1\n      - name: next\n        run: echo\n`));
  assert.ok(f.some((x) => x.includes("persist-credentials")));
});

test("dangerous triggers are refused", () => {
  for (const on of ["on:\n  pull_request_target:\n", "on: [push, workflow_run]\n", "on:\n  - pull_request_target\n"]) {
    const f = checkWorkflow("w.yml", `${on}permissions: {}\njobs: {}\n`);
    assert.ok(f.some((x) => x.includes("pull_request_target")), on);
  }
});

test("missing top-level permissions is refused", () => {
  const f = checkWorkflow("w.yml", "on: push\njobs: {}\n");
  assert.ok(f.some((x) => x.includes("top-level permissions")));
});

test("caches, npm install and bare npx are refused", () => {
  const body = `      - uses: actions/cache@${SHA} # v4.0.0\n      - uses: actions/setup-node@${SHA} # v7.1.0\n        with:\n          cache: npm\n      - run: npm install\n      - run: npm ci\n      - run: npx some-tool\n`;
  const f = checkWorkflow("w.yml", wf(body)).join("\n");
  assert.match(f, /actions\/cache/);
  assert.match(f, /dependency caches/);
  assert.match(f, /not npm install/);
  assert.match(f, /add --ignore-scripts/);
  assert.match(f, /--no-install/);
});

const pkg = (over = {}) => ({
  version: "1.0.0",
  resolved: "https://registry.npmjs.org/x/-/x-1.0.0.tgz",
  integrity: "sha512-AAAA",
  ...over,
});

test("lockfile entries must come from the npm registry with sha512", () => {
  const deny = parseDenylist("");
  const lock = {
    lockfileVersion: 3,
    packages: {
      "": { name: "root" },
      "node_modules/ok": pkg(),
      "node_modules/git": pkg({ resolved: "git+ssh://git@github.com/a/b.git#79ac49ee" }),
      "node_modules/other": pkg({ resolved: "https://registry.example.com/x.tgz" }),
      "node_modules/sha1": pkg({ integrity: "sha1-AAAA" }),
      "node_modules/local": { link: true, resolved: "../local" },
    },
  };
  const f = checkLockfile("p/package-lock.json", lock, deny).join("\n");
  assert.doesNotMatch(f, /\bok@/);
  assert.doesNotMatch(f, /local/);
  assert.match(f, /git@1\.0\.0 resolves from/);
  assert.match(f, /other@1\.0\.0 resolves from/);
  assert.match(f, /sha1@1\.0\.0 has no sha512/);
});

test("install scripts need the allowlist", () => {
  const deny = parseDenylist("");
  const lock = { packages: { "node_modules/esbuild": pkg({ hasInstallScript: true }), "node_modules/evil": pkg({ hasInstallScript: true }) } };
  const f = checkLockfile("l", lock, deny);
  assert.equal(f.length, 1);
  assert.match(f[0], /evil@1\.0\.0 has an install script/);
});

test("denylisted versions and names are refused, other versions pass", () => {
  const deny = parseDenylist("# c\n@tanstack/react-router@1.169.5\nevil-pkg # whole package\n");
  const lock = {
    packages: {
      "node_modules/@tanstack/react-router": pkg({ version: "1.169.5" }),
      "node_modules/a/node_modules/evil-pkg": pkg({ version: "9.9.9" }),
      "node_modules/@tanstack/router-core": pkg({ version: "1.169.5" }),
    },
  };
  const f = checkLockfile("l", lock, deny).join("\n");
  assert.match(f, /@tanstack\/react-router@1\.169\.5 is a known-malicious/);
  assert.match(f, /evil-pkg@9\.9\.9 is a known-malicious/);
  assert.doesNotMatch(f, /router-core/);
});

test("nameOfKey reads nested and scoped keys", () => {
  assert.equal(nameOfKey("node_modules/a/node_modules/@s/b"), "@s/b");
  assert.equal(nameOfKey(""), undefined);
});

test("auto-run configuration and unreviewed docs scripts are refused", () => {
  const f = checkFiles([
    ".vscode/tasks.json",
    ".claude/settings.json",
    "a/.claude/router_runtime.js",
    "docs/footer-tagline.js",
    "docs/new.js",
  ]).join("\n");
  assert.match(f, /\.vscode\/tasks\.json/);
  assert.match(f, /\.claude\/settings\.json/);
  assert.match(f, /router_runtime\.js/);
  assert.match(f, /docs\/new\.js/);
  assert.doesNotMatch(f, /footer-tagline/);
});

test("a package.json with dependencies needs a lockfile", () => {
  assert.equal(checkFiles(["a/package.json"], () => ({ dependencies: { x: "1" } })).length, 1);
  assert.equal(checkFiles(["a/package.json"], () => ({ scripts: {} })).length, 0);
  assert.equal(checkFiles(["a/package.json", "a/package-lock.json"]).length, 0);
});
