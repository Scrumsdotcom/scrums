// Builds the GitHub Pages site that serves the schema identifiers and the
// JSON-LD namespace.
//
// Usage: node .github/scripts/build-pages.mjs <site-base-url> <out-dir>
//
// Every schema is written to the path its own $id names, relative to the
// site base. A schema whose $id is outside the base, or whose $id file name
// differs from its source file name, fails the build. The namespace page and
// context come from generated/context.jsonld, which `cac generate` writes.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";

const [base, out] = process.argv.slice(2);
if (!base || !out || !base.endsWith("/")) {
  console.error("Usage: build-pages.mjs <site-base-url ending in /> <out-dir>");
  process.exit(2);
}

const repoUrl = process.env.REPO_URL ?? "https://github.com/gez-scrumsdotcom/Company-as-Code";
const errors = [];

if (existsSync(out)) {
  console.error(`${out} already exists. Pass a new directory.`);
  process.exit(2);
}
mkdirSync(out, { recursive: true });

function write(rel, content) {
  const target = join(out, rel);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}

const escape = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Schemas: the output path is the $id with the base removed.
const schemaFiles = readdirSync("schemas").filter((f) => f.endsWith(".schema.json")).sort();
const published = [];
for (const file of schemaFiles) {
  const text = readFileSync(join("schemas", file), "utf8");
  const id = JSON.parse(text).$id;
  if (typeof id !== "string" || !id.startsWith(base)) {
    errors.push(`schemas/${file}: $id ${JSON.stringify(id)} is not under ${base}`);
    continue;
  }
  const rel = id.slice(base.length);
  if (basename(rel) !== file) {
    errors.push(`schemas/${file}: $id ${id} names a different file`);
    continue;
  }
  write(rel, text);
  published.push(rel);
}

// Namespace: the context as generated, plus a page listing the cac: terms.
const contextText = readFileSync("generated/context.jsonld", "utf8");
const context = JSON.parse(contextText)["@context"];
const nsIri = context.cac;
if (typeof nsIri !== "string" || nsIri !== `${base}ns#`) {
  errors.push(`generated/context.jsonld: cac namespace ${JSON.stringify(nsIri)} is not ${base}ns#`);
}

if (errors.length > 0) {
  for (const e of errors) console.error(`✗ ${e}`);
  process.exit(1);
}

write("ns/context.jsonld", contextText);

const terms = new Set();
for (const value of Object.values(context)) {
  const iri = typeof value === "string" ? value : value?.["@id"];
  if (typeof iri === "string" && iri.startsWith("cac:")) terms.add(iri.slice(4));
}
const termRows = [...terms]
  .sort()
  .map((t) => `<li id="${escape(t)}"><code>cac:${escape(t)}</code></li>`)
  .join("\n");

const page = (title, body) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<style>
:root { color-scheme: light dark; }
body { font-family: system-ui, sans-serif; max-width: 48rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
code { font-family: ui-monospace, monospace; }
</style>
</head>
<body>
${body}
</body>
</html>
`;

write(
  "ns/index.html",
  page(
    "Company-as-Code namespace",
    `<h1>Company-as-Code namespace</h1>
<p>Namespace IRI: <code>${escape(nsIri)}</code></p>
<p>JSON-LD context: <a href="context.jsonld">context.jsonld</a></p>
<p>Terms minted in this namespace:</p>
<ul>
${termRows}
</ul>
<p>Source: <a href="${escape(repoUrl)}">${escape(repoUrl)}</a></p>`,
  ),
);

const schemaRows = published
  .map((rel) => `<li><a href="${escape(rel)}"><code>${escape(rel)}</code></a></li>`)
  .join("\n");
write(
  "index.html",
  page(
    "Company-as-Code",
    `<h1>Company-as-Code</h1>
<p>This site serves the schema identifiers and the JSON-LD namespace of
<a href="${escape(repoUrl)}">Company-as-Code</a>.</p>
<p>Namespace: <a href="ns/">ns/</a></p>
<p>Schemas:</p>
<ul>
${schemaRows}
</ul>`,
  ),
);

write(".nojekyll", "");

console.log(`✓ pages: ${published.length} schema(s), namespace with ${terms.size} term(s), written to ${out}`);
