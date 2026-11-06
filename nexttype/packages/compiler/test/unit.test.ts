/** Unit tests for the codec, the manifest loader, and the checker API. */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CheckError,
  DEFAULT_LIMITS,
  checkStream,
  decodeStream,
  decodeUtf8,
  evaluate,
  formatResult,
  loadManifest,
  manifestFromContext,
  printFrame,
  resolveLimits,
} from "../src/index.js";

const L = DEFAULT_LIMITS;

function codeOf(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    if (e instanceof CheckError) return e.code;
    throw e;
  }
  return "none";
}

test("decode: canonical frames round-trip", () => {
  const src = "c0   (sig t Z (= t (sum xs)))  ; comment\r\nf0 (pair (sum xs) refl)\n\nput f0 c0 @b0\nck f0 @a0\nget o0 256\n";
  const frames = decodeStream(src, L);
  assert.deepEqual(frames.map(printFrame), ["c0 (sig t Z (= t (sum xs)))", "f0 (pair (sum xs) refl)", "put f0 c0 @b0", "ck f0 @a0", "get o0 256"]);
  const again = decodeStream(frames.map(printFrame).join("\n"), L).map(printFrame);
  assert.deepEqual(again, frames.map(printFrame));
});

test("decode: rejects malformed input with stable codes", () => {
  assert.equal(codeOf(() => decodeStream("c0 (Z", L)), "SYN");
  assert.equal(codeOf(() => decodeStream("c0 Z)", L)), "SYN");
  assert.equal(codeOf(() => decodeStream("c01 Z", L)), "SYN");
  assert.equal(codeOf(() => decodeStream("f0 -0", L)), "SYN");
  assert.equal(codeOf(() => decodeStream("put f0 c0 b0", L)), "ALIAS");
  assert.equal(codeOf(() => decodeStream("put c0 f0 @b0", L)), "SLOT");
  assert.equal(codeOf(() => decodeStream("get o0 0", L)), "LIM");
  assert.equal(codeOf(() => decodeStream("f0 x\u0000", L)), "SYN");
  assert.equal(codeOf(() => decodeStream("f0 x ; ⁦", L)), "SYN");
  assert.equal(codeOf(() => decodeStream("﻿f0 x", L)), "SYN");
  assert.equal(codeOf(() => decodeStream("f0 café", L)), "SYN");
  assert.equal(codeOf(() => decodeStream("f0 a\rb", L)), "SYN");
});

test("decode: non-ASCII text is allowed in comments only", () => {
  assert.equal(decodeStream("c0 Z ; Γ = {n:N} · ℤ\n", L).length, 1);
});

test("decode: limits are enforced before work", () => {
  const tight = resolveLimits({ maxFrames: 2, maxDepth: 3, maxNodes: 5, maxLiteralDigits: 3, maxFrameBytes: 32 });
  assert.equal(codeOf(() => decodeStream("c0 Z\nc1 Z\nc2 Z\n", tight)), "LIM");
  assert.equal(codeOf(() => decodeStream("f0 ((((S 0))))", tight)), "LIM");
  assert.equal(codeOf(() => decodeStream("f0 (a b c d e f)", tight)), "LIM");
  assert.equal(codeOf(() => decodeStream("f0 1234", tight)), "LIM");
  assert.equal(codeOf(() => decodeStream("f0 " + "x".repeat(40), tight)), "LIM");
  assert.equal(codeOf(() => decodeUtf8(new Uint8Array(L.maxInputBytes + 1), L)), "LIM");
});

test("decode: invalid UTF-8 is rejected", () => {
  assert.equal(codeOf(() => decodeUtf8(new Uint8Array([0x63, 0x30, 0x20, 0xc3, 0x28]), L)), "SYN");
});

test("limits: callers may tighten but not loosen", () => {
  assert.equal(resolveLimits({ maxSteps: 10 }).maxSteps, 10);
  assert.equal(resolveLimits({ maxSteps: 10 ** 12 }).maxSteps, L.maxSteps);
  assert.throws(() => resolveLimits({ maxSteps: 0 }), RangeError);
});

test("manifest: strict shape", () => {
  const bad = (j: unknown) => codeOf(() => loadManifest(j));
  assert.equal(bad([]), "MANIFEST");
  assert.equal(bad({ format: "nt-manifest/2" }), "MANIFEST");
  assert.equal(bad({ format: "nt-manifest/1", extra: 1 }), "MANIFEST");
  assert.equal(bad({ format: "nt-manifest/1", context: [{ name: "pi", type: "N" }] }), "MANIFEST");
  assert.equal(bad({ format: "nt-manifest/1", context: [{ name: "sum", type: "N" }] }), "MANIFEST");
  assert.equal(bad({ format: "nt-manifest/1", context: [{ name: "x", type: "N" }, { name: "x", type: "Z" }] }), "MANIFEST");
  assert.equal(bad({ format: "nt-manifest/1", constants: [{ name: "sum", type: "Z" }] }), "MANIFEST");
  assert.equal(bad({ format: "nt-manifest/1", constants: [{ name: "k", type: "Z", implicit: 1 }] }), "MANIFEST");
  assert.equal(bad({ format: "nt-manifest/1", contracts: { f0: "Z" } }), "MANIFEST");
  assert.equal(bad({ format: "nt-manifest/1", aliases: { "@b0": "sha256:abc" } }), "MANIFEST");
  assert.equal(bad({ format: "nt-manifest/1", context: [{ name: "x", type: "undefinedThing" }] }), "MANIFEST");
  assert.equal(bad(JSON.parse('{"format":"nt-manifest/1","__proto__":{"polluted":true}}')), "MANIFEST");
  assert.equal(({} as Record<string, unknown>).polluted, undefined);
});

test("manifest: digests are stable and alpha-invariant", () => {
  const a = manifestFromContext("n:N, xs:V Z n");
  const b = loadManifest({ format: "nt-manifest/1", context: [{ name: "n", type: "N" }, { name: "xs", type: "(V Z n)" }] });
  assert.equal(a.baseDigest, b.baseDigest);
  const c = loadManifest({ format: "nt-manifest/1", contracts: { c0: "(pi A U0 (pi x A A))" } });
  const d = loadManifest({ format: "nt-manifest/1", contracts: { c0: "(pi B U0 (pi y B B))" } });
  assert.equal(c.approvalDigest, d.approvalDigest);
  const e = loadManifest({ format: "nt-manifest/1", contracts: { c0: "(pi B U0 (pi y B U0))" } });
  assert.notEqual(c.approvalDigest, e.approvalDigest);
});

test("check: evidence binds the approval, the contract, and the fragment", () => {
  const m = manifestFromContext("n:N, xs:V Z n");
  const run = (frag: string) => checkStream(`c0 Z\nf0 ${frag}\nput f0 c0 @b0\nck f0 @a0\n`, m).diagnostics[0].evidence;
  assert.match(run("(sum xs)") ?? "", /^sha256:[0-9a-f]{64}$/);
  assert.equal(run("(sum xs)"), run("(sum xs)"));
  assert.notEqual(run("(sum xs)"), run("(add (sum xs) 0)"));
});

test("check: the stream must contain a ck", () => {
  const r = checkStream("c0 Z\nf0 1\n", manifestFromContext(""));
  assert.equal(r.ok, false);
  assert.equal(r.diagnostics[0].code, "SLOT");
});

test("check: get returns bounded context and reports what it omits", () => {
  const m = manifestFromContext("n:N, xs:V Z n");
  const r = checkStream("c0 (sig t Z (= t (sum xs)))\nf0 (pair (sum xs) refl)\nput f0 c0 @b0\nck f0 @a0\nget o0 200\nget o0 30\n", m);
  assert.equal(r.contexts.length, 2);
  assert.equal(r.contexts[0].omittedBytes, 0);
  assert.match(r.contexts[0].text, /^goal \(sig t Z \(= t \(sum xs\)\)\)\nn : N\nxs : \(V Z n\)$/);
  assert.ok(r.contexts[1].omittedBytes > 0);
  assert.ok(Buffer.byteLength(r.contexts[1].text) <= 30);
  assert.match(formatResult(r), /; o0 omitted \d+ bytes \(budget 30\)/);
});

test("check: step budget exhaustion is unknown RES, not a crash", () => {
  const m = loadManifest({ format: "nt-manifest/1" }, { maxSteps: 50 });
  const r = checkStream("c0 (= (sum (cons 1 (cons 2 (cons 3 (cons 4 (cons 5 nil)))))) 15)\nf0 refl\nput f0 c0 @b0\nck f0 @a0\n", m);
  assert.equal(r.diagnostics[0].result, "unknown");
  assert.equal(r.diagnostics[0].code, "RES");
});

test("eval: reference evaluation", () => {
  const m = manifestFromContext("");
  assert.deepEqual(evaluate("(sum (cons 2 (cons 3 (cons -1 nil))))", m), { value: "4", type: "Z" });
  assert.deepEqual(evaluate("(mul (sub 7 10) (neg 4))", m), { value: "12", type: "Z" });
  assert.deepEqual(evaluate("(S (S 3))", m), { value: "5", type: "N" });
  assert.deepEqual(evaluate("(int 5)", m), { value: "5", type: "Z" });
});
