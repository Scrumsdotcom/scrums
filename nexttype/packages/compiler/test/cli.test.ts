/** Process-level CLI contract: arguments, streams, output, and exit status. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CLI, ROOT } from "./harness.js";

const stream = "c0 Z\nf0 -2\nput f0 c0 @b0\nck f0 @a0\n";

function run(args: string[], input = "", cwd = ROOT) {
  const p = spawnSync(process.execPath, [CLI, ...args], { input, cwd, encoding: "utf8", timeout: 5000 });
  assert.ifError(p.error);
  assert.equal(p.signal, null);
  return p;
}

const invalid: [string[], string][] = [
  [["fmt", "--json"], "fmt does not support --json"],
  [["fmt", "--manifest", "missing.json"], "fmt does not support --manifest"],
  [["fmt", "--context", "A:N"], "fmt does not support --context"],
  [["check", "--manifest"], "--manifest needs a value"],
  [["check", "--context"], "--context needs a value"],
  [["check", "--manifest", "--json"], "--manifest needs a value"],
  [["eval", "--context", "--", "-2"], "--context needs a value"],
  [["check", "--manifest", ""], "--manifest needs a value"],
  [["check", "--manifest", "missing.json", "--manifest", "other.json"], "duplicate option --manifest"],
  [["eval", "--context", "A:N", "--context", "B:N", "-2"], "duplicate option --context"],
  [["check", "--json", "--json"], "duplicate option --json"],
  [["check", "--manifest", "missing.json", "--context", ""], "use --manifest or --context, not both"],
  [["check", "--manifest", "missing.json", "--bogus"], "unknown option --bogus"],
  [["check", "--manifest", "missing.json", "one.ntd", "two.ntd"], "check takes at most one FILE"],
  [["eval", "--manifest", "missing.json"], "eval takes exactly one TERM"],
  [["eval", "1", "2"], "eval takes exactly one TERM"],
  [["fmt", "one.ntd", "two.ntd"], "fmt takes at most one FILE"],
  ...["prelude", "limits", "version", "--version", "help", "--help", "-h"].map((cmd): [string[], string] => [
    [cmd, "unexpected"], `${cmd} takes no arguments`,
  ]),
];

for (const [args, message] of invalid) {
  test(`CLI rejects ${JSON.stringify(args)} before reading input`, () => {
    const p = run(args, "invalid input");
    assert.equal(p.status, 2);
    assert.equal(p.stdout, "");
    assert.ok(p.stderr.startsWith(`ntc: ${message}\n`), p.stderr);
  });
}

test("CLI check accepts implicit and explicit stdin, with options after a positional argument", () => {
  for (const args of [["check"], ["check", "-"], ["check", "-", "--json", "--context", ""]]) {
    const p = run(args, stream);
    assert.equal(p.status, 0, p.stderr);
    assert.equal(p.stderr, "");
    if (args.includes("--json")) {
      const result = JSON.parse(p.stdout);
      assert.equal(result.format, "nt-result/1");
      assert.equal(result.ok, true);
      assert.equal(result.diagnostics[0].result, "proved");
    } else assert.match(p.stdout, /^proved o0 TY f0\n; evidence sha256:[a-f0-9]{64}\n$/);
  }
});

test("CLI eval keeps negative literals, JSON, and manifest stdin", () => {
  for (const args of [["eval", "-2"], ["eval", "--", "-2"], ["eval", "--manifest", "-", "-2"]]) {
    const p = run(args, '{"format":"nt-manifest/1"}');
    assert.equal(p.status, 0, p.stderr);
    assert.equal(p.stdout, "-2 : Z\n");
    assert.equal(p.stderr, "");
  }
  const p = run(["eval", "--json", "(add 2 3)"]);
  assert.equal(p.status, 0, p.stderr);
  assert.deepEqual(JSON.parse(p.stdout), { value: "5", type: "Z" });
});

test("CLI separator treats option names as filenames and stops all option parsing", () => {
  const dir = mkdtempSync(join(tmpdir(), "ntc-cli-"));
  try {
    writeFileSync(join(dir, "--json"), stream);
    writeFileSync(join(dir, "--manifest"), stream);
    writeFileSync(join(dir, "--approval.json"), '{"format":"nt-manifest/1"}');
    for (const cmd of ["check", "fmt"]) {
      for (const file of ["--json", "--manifest"]) {
        const p = run([cmd, "--", file], "", dir);
        assert.equal(p.status, 0, p.stderr);
        assert.equal(p.stderr, "");
        if (cmd === "check") assert.match(p.stdout, /^proved o0 TY f0\n/);
        else assert.equal(p.stdout, stream);
      }
      const p = run([cmd, "--", "--json", "--context", ""], "", dir);
      assert.equal(p.status, 2);
      assert.equal(p.stdout, "");
      assert.match(p.stderr, /takes at most one FILE/);
    }
    const p = run(["check", "--manifest", "./--approval.json", "--", "--json"], "", dir);
    assert.equal(p.status, 0, p.stderr);
    assert.match(p.stdout, /^proved o0 TY f0\n/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CLI preserves input rejection and file-error exit codes", () => {
  const invalid = run(["check", "--json"], "c0 N\nf0 -2\nput f0 c0 @b0\nck f0 @a0\n");
  assert.equal(invalid.status, 1);
  assert.equal(JSON.parse(invalid.stdout).ok, false);
  assert.equal(invalid.stderr, "");
  const missing = run(["check", "examples/no-such-cli-test-file.ntd"]);
  assert.equal(missing.status, 2);
  assert.equal(missing.stdout, "");
  assert.match(missing.stderr, /ENOENT/);
});

test("CLI fmt stdin and zero-argument commands retain their output", () => {
  const p = run(["fmt", "-"], "c0   Z ; comment\n");
  assert.equal(p.status, 0, p.stderr);
  assert.equal(p.stdout, "c0 Z\n");
  for (const cmd of ["prelude", "limits", "version", "--version", "help", "--help", "-h"]) {
    const p = run([cmd]);
    assert.equal(p.status, 0, p.stderr);
    assert.equal(p.stderr, "");
    assert.notEqual(p.stdout, "");
  }
  assert.match(run(["help"]).stdout, /ntc eval .*\[--json\].*\[--\] TERM/);
});
