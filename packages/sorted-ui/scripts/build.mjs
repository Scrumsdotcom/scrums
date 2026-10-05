import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const dist = join(root, "dist");

rmSync(dist, { recursive: true, force: true });
execFileSync("npx", ["--no-install", "tsc", "-p", "tsconfig.build.json"], { cwd: root, stdio: "inherit" });

function copyCss(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) copyCss(p);
    else if (name.endsWith(".css")) {
      const css = readFileSync(p, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\n{3,}/g, "\n\n");
      const out = join(dist, p.slice(src.length + 1));
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, css);
    }
  }
}
copyCss(src);
