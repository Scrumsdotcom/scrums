/**
 * Conformance: every case under conformance/, every example stream under
 * examples/, and every `ntd` and `console` block in the documentation.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { loadManifest } from "../src/index.js";
import { ROOT, actual, docBlocks, expected, runConsole, walk } from "./harness.js";

for (const file of walk(join(ROOT, "conformance"), ".ntd")) {
  test(`conformance ${relative(ROOT, file)}`, () => {
    const text = readFileSync(file, "utf8");
    const want = expected(text);
    assert.ok(want.length > 0, "a conformance case needs at least one '; expect:' line");
    assert.deepEqual(actual(text), want);
  });
}

for (const file of walk(join(ROOT, "examples"), ".ntd")) {
  test(`example ${relative(ROOT, file)} is proved`, () => {
    const text = readFileSync(file, "utf8");
    const got = actual(text, loadManifest(JSON.parse(readFileSync(join(dirname(file), "manifest.json"), "utf8"))));
    assert.ok(got.length > 0 && got.every((l) => l.startsWith("proved ")), got.join("\n"));
  });
}

const docs = [...walk(join(ROOT, "docs"), ".md"), ...walk(join(ROOT, "examples"), ".md"), join(ROOT, "README.md"), join(ROOT, "packages/compiler/README.md")];

for (const block of docBlocks(docs, ["ntd"])) {
  test(`doc ${relative(ROOT, block.file)}:${block.line} (ntd)`, () => {
    const want = expected(block.body);
    assert.ok(want.length > 0, "an ntd block needs at least one '; expect:' line; use a text block for non-runnable notation");
    assert.deepEqual(actual(block.body), want);
  });
}

for (const block of docBlocks(docs, ["console"])) {
  test(`doc ${relative(ROOT, block.file)}:${block.line} (console)`, () => {
    for (const { want, got } of runConsole(block.body)) assert.equal(got, want);
  });
}
