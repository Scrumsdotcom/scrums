/**
 * Property tests with fixed seeds. Set NT_PROPERTY_RUNS to run more cases.
 * A failure message includes the seed and the input, so it reproduces.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_LIMITS, checkStream, decodeStream, evaluate, manifestFromContext, printFrame } from "../src/index.js";
import { Rng, intExpr, sexp, stream } from "./gen.js";

const RUNS = Number(process.env.NT_PROPERTY_RUNS ?? 300);
const empty = manifestFromContext("");
const ctx = manifestFromContext("A:U0, n:N, xs:V Z n, v:V A (S n), x:Z");

test("the reference evaluator agrees with bigint arithmetic", () => {
  const r = new Rng(1);
  for (let i = 0; i < RUNS; i++) {
    const e = intExpr(r, 4);
    assert.deepEqual(evaluate(`(add 0 ${e.text})`, empty), { value: e.value.toString(), type: "Z" }, e.text);
  }
});

test("refl proves a closed expression equal to its value and refutes any other value", () => {
  const r = new Rng(2);
  for (let i = 0; i < RUNS; i++) {
    const e = intExpr(r, 3);
    const run = (v: bigint) => checkStream(`c0 (= ${e.text} ${v})\nf0 refl\nput f0 c0 @b0\nck f0 @a0\n`, empty).diagnostics[0];
    assert.equal(run(e.value).result, "proved", e.text);
    const wrong = run(e.value + 1n);
    assert.equal(wrong.result, "refuted", e.text);
    assert.equal(wrong.code, "EQ");
  }
});

test("canonical printing is a fixed point of decoding", () => {
  const r = new Rng(3);
  for (let i = 0; i < RUNS; i++) {
    const text = `c0 ${sexp(r, 6)}\nf0 ${sexp(r, 6)}\nput f0 c0 @b0\nck f0 @a0\n`;
    let frames;
    try {
      frames = decodeStream(text, DEFAULT_LIMITS);
    } catch {
      continue;
    }
    const once = frames.map(printFrame).join("\n");
    const twice = decodeStream(once, DEFAULT_LIMITS).map(printFrame).join("\n");
    assert.equal(twice, once, text);
  }
});

test("the checker never throws and always reports a closed result vocabulary", () => {
  const r = new Rng(4);
  const results = new Set(["proved", "refuted", "unknown", "unsupported", "invalid"]);
  for (let i = 0; i < RUNS * 3; i++) {
    const text = stream(r);
    for (const m of [empty, ctx]) {
      const out = checkStream(text, m);
      assert.ok(out.diagnostics.length > 0, text);
      for (const d of out.diagnostics) {
        assert.ok(results.has(d.result), JSON.stringify(d));
        assert.notEqual(d.code, "KERNEL", `kernel disagreement or internal error on:\n${text}\n${d.message}`);
      }
      assert.equal(out.ok, out.diagnostics.every((d) => d.result === "proved"));
    }
  }
});

test("normal forms are stable: evaluating a normal form returns it unchanged", () => {
  const r = new Rng(5);
  for (let i = 0; i < RUNS; i++) {
    const e = intExpr(r, 3);
    const body = `(add ${e.text} (sum (cons x xs)))`;
    const once = evaluate(body, ctx);
    const twice = evaluate(once.value, ctx);
    assert.deepEqual(twice, once, body);
  }
});
