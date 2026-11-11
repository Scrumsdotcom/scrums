#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { strictParse } from "./cli-args.js";
import { validateCommand } from "./validate.js";
import { generateCommand } from "./generate.js";
import { hubCommand } from "./hub.js";
import { nl2mFromArgv } from "./nl2m.js";
import { doctorCommand } from "./doctor.js";
import { boundaryCheckCommand, boundaryExplainCommand, initCommand } from "./boundary.js";
import { upgradeCommand } from "./upgrade.js";
import { migrateCommand } from "./migrate.js";
import { conformanceCommand, verdictCommand } from "./conformance.js";
import { importAcceptCommand, importDraftCommand, importListCommand } from "./import.js";

async function main() {
  const [, , cmd, ...rest] = process.argv;

  switch (cmd) {
    case "validate": {
      if (!strictParse("validate", rest, {})) process.exit(2);
      const ok = await validateCommand();
      process.exit(ok ? 0 : 1);
      break;
    }
    case "generate": {
      // Strict parsing is load-bearing here: `generate --chek` must fail,
      // not silently run the write-mode generator instead of the CI gate.
      const parsed = strictParse("generate", rest, { check: { type: "boolean" } });
      if (!parsed) process.exit(2);
      const ok = await generateCommand({ check: parsed.values.check === true });
      process.exit(ok ? 0 : 1);
      break;
    }
    case "doctor": {
      const parsed = strictParse("doctor", rest, { strict: { type: "boolean" } });
      if (!parsed) process.exit(2);
      const ok = await doctorCommand({ strict: parsed.values.strict === true });
      process.exit(ok ? 0 : 1);
      break;
    }
    case "hub": {
      const ok = await hubCommand(rest);
      process.exit(ok ? 0 : 1);
      break;
    }
    case "boundary": {
      const [sub, ...args] = rest;
      if (sub === "check") {
        if (!strictParse("boundary check", args, {})) process.exit(2);
        process.exit((await boundaryCheckCommand()) ? 0 : 1);
      }
      if (sub === "explain" && args.length === 1) {
        process.exit((await boundaryExplainCommand(args[0]!)) ? 0 : 1);
      }
      console.error("Usage: cac boundary check | cac boundary explain <path>");
      process.exit(2);
      break;
    }
    case "init": {
      const parsed = strictParse("init", rest, {
        name: { type: "string" },
        namespace: { type: "string" },
        write: { type: "boolean" },
      });
      if (!parsed) process.exit(2);
      const { name, namespace } = parsed.values;
      if (typeof name !== "string" || typeof namespace !== "string") {
        console.error('Usage: cac init --name "<Company>" --namespace <prefix> [--write]');
        process.exit(2);
      }
      const ok = await initCommand({ name, namespace, write: parsed.values.write === true });
      process.exit(ok ? 0 : 1);
      break;
    }
    case "upgrade": {
      const parsed = strictParse("upgrade", rest, {
        from: { type: "string" },
        write: { type: "boolean" },
        "allow-conflicts": { type: "boolean" },
      });
      if (!parsed) process.exit(2);
      if (typeof parsed.values.from !== "string") {
        console.error("Usage: cac upgrade --from <path-to-upstream-release> [--write] [--allow-conflicts]");
        process.exit(2);
      }
      const ok = await upgradeCommand({
        from: parsed.values.from,
        write: parsed.values.write === true,
        allowConflicts: parsed.values["allow-conflicts"] === true,
      });
      process.exit(ok ? 0 : 1);
      break;
    }
    case "migrate": {
      const parsed = strictParse("migrate", rest, { write: { type: "boolean" } });
      if (!parsed) process.exit(2);
      const ok = await migrateCommand({ write: parsed.values.write === true });
      process.exit(ok ? 0 : 1);
      break;
    }
    case "conformance": {
      if (rest[0] === "verdict") {
        if (rest.length !== 2) {
          console.error("Usage: cac conformance verdict <case-dir>");
          process.exit(2);
        }
        process.exit((await verdictCommand(rest[1]!)) ? 0 : 1);
      }
      const parsed = strictParse("conformance", rest, { impl: { type: "string" }, json: { type: "boolean" } });
      if (!parsed) process.exit(2);
      const impl = typeof parsed.values.impl === "string" ? parsed.values.impl : undefined;
      const ok = await conformanceCommand({ impl, json: parsed.values.json === true });
      process.exit(ok ? 0 : 1);
      break;
    }
    case "import": {
      const [sub, ...args] = rest;
      if (sub === "list") process.exit((await importListCommand()) ? 0 : 1);
      if (sub === "accept") {
        const parsed = strictParse("import accept", args, { into: { type: "string" }, write: { type: "boolean" } }, true);
        if (!parsed || parsed.positionals.length !== 1) {
          console.error("Usage: cac import accept <importer> [--into <company/...>] [--write]");
          process.exit(2);
        }
        const into = typeof parsed.values.into === "string" ? parsed.values.into : "company/integrations/seeds";
        const ok = await importAcceptCommand(parsed.positionals[0]!, { into, write: parsed.values.write === true });
        process.exit(ok ? 0 : 1);
      }
      if (sub) {
        const parsed = strictParse("import", args, { file: { type: "string" }, write: { type: "boolean" } });
        if (!parsed || typeof parsed.values.file !== "string") {
          console.error("Usage: cac import <importer> --file <path> [--write]");
          process.exit(2);
        }
        const ok = await importDraftCommand(sub, { file: parsed.values.file, write: parsed.values.write === true });
        process.exit(ok ? 0 : 1);
      }
      console.error("Usage: cac import list | cac import <importer> --file <path> [--write] | cac import accept <importer>");
      process.exit(2);
      break;
    }
    case "nl2m": {
      const ok = await nl2mFromArgv(rest);
      process.exit(ok ? 0 : 1);
      break;
    }
    case "version":
    case "--version":
    case "-v": {
      console.log(await cliVersion());
      process.exit(0);
      break;
    }
    case "help":
    case "--help":
    case "-h":
    case undefined: {
      printHelp();
      process.exit(cmd === undefined ? 1 : 0);
      break;
    }
    default: {
      console.error(`Unknown command: ${cmd}\n`);
      printHelp();
      process.exit(1);
    }
  }
}

async function cliVersion(): Promise<string> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(await fs.readFile(path.resolve(here, "..", "package.json"), "utf8"));
  return `cac ${pkg.version}`;
}

function printHelp(): void {
  console.log(
    `Company-as-Code CLI

Usage:
  cac validate              Validate every manifest, agent, workflow, initiative, goal, metric.
  cac generate              Run deterministic generators. Writes /generated/*.
  cac generate --check      Run generators in check-only mode. Exits non-zero on drift.
  cac doctor                Standing health inspection. Findings fail; warnings report.
  cac doctor --strict       Promote warnings to findings.
  cac hub list              List CaC-Hub modules available to import.
  cac hub show <name>       Show one hub module's metadata and scaffold inventory.
  cac hub add <name>        Dry-run: print the files that would be scaffolded into /company.
  cac hub add <name> --write [--into <path>]
                            Scaffold a hub module into /company.
  cac hub validate          Validate every hub module payload against the framework schemas.
  cac boundary check        Check the framework/instance boundary (upstream: lock is current; fork: what changed).
  cac boundary explain <path>
                            Say which boundary class a path belongs to, and what that means.
  cac init --name "<Company>" --namespace <prefix> [--write]
                            Declare this tree a fork in cac.yaml (dry-run unless --write).
  cac upgrade --from <path> [--write] [--allow-conflicts]
                            In a fork: take a new upstream release, replacing only framework files the fork never touched.
  cac migrate [--write]     Move instance documents to the current apiVersion (dry-run unless --write).
  cac conformance [--impl "<command>"] [--json]
                            Run the conformance suite against the reference implementation, or any command.
  cac conformance verdict <case-dir>
                            Print the reference implementation's verdict on one case, in the protocol's JSON.
  cac import list           List importers that draft documents from existing sources.
  cac import <importer> --file <path> [--write]
                            Draft documents into company/.drafts/<importer>/ (never into the graph).
  cac import accept <importer> [--into <company/...>] [--write]
                            Validate drafts and move them into the company graph, still 'proposed'.
  cac nl2m "<prose>"        Draft a linked Initiative + Goal + Metric from a prose description (dry-run).
  cac nl2m --file <path>    Read the prose from a file instead of an argument.
  cac nl2m "<prose>" --write [--owner <id>]
                            Write the drafted YAML into /company/{initiatives,goals,metrics}.
  cac version               Print the CLI version.

The generators are deterministic: identical inputs produce identical outputs.
The check mode is the CI drift gate.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
