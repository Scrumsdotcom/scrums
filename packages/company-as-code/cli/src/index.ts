#!/usr/bin/env node
import { validateCommand } from "./validate.js";
import { generateCommand } from "./generate.js";
import { hubCommand } from "./hub.js";
import { nl2mFromArgv } from "./nl2m.js";

async function main() {
  const [, , cmd, ...rest] = process.argv;
  const check = rest.includes("--check");

  switch (cmd) {
    case "validate": {
      const ok = await validateCommand();
      process.exit(ok ? 0 : 1);
      break;
    }
    case "generate": {
      const ok = await generateCommand({ check });
      process.exit(ok ? 0 : 1);
      break;
    }
    case "hub": {
      const ok = await hubCommand(rest);
      process.exit(ok ? 0 : 1);
      break;
    }
    case "nl2m": {
      const ok = await nl2mFromArgv(rest);
      process.exit(ok ? 0 : 1);
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

function printHelp(): void {
  console.log(
    `Company-as-Code CLI

Usage:
  cac validate              Validate every manifest, agent, workflow, initiative, goal, metric.
  cac generate              Run deterministic generators. Writes /generated/*.
  cac generate --check      Run generators in check-only mode. Exits non-zero on drift.
  cac hub list              List CaC-Hub modules available to import.
  cac hub show <name>       Show one hub module's metadata and scaffold inventory.
  cac hub add <name>        Dry-run: print the files that would be scaffolded into /company.
  cac hub add <name> --write [--into <path>]
                            Scaffold a hub module into /company.
  cac hub validate          Validate every hub module payload against the framework schemas.
  cac nl2m "<prose>"        Draft a linked Initiative + Goal + Metric from a prose description (dry-run).
  cac nl2m --file <path>    Read the prose from a file instead of an argument.
  cac nl2m "<prose>" --write [--owner <id>]
                            Write the drafted YAML into /company/{initiatives,goals,metrics}.

The generators are deterministic: identical inputs produce identical outputs.
The check mode is the CI drift gate.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
