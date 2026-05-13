#!/usr/bin/env node
import { validateCommand } from "./validate.js";
import { generateCommand } from "./generate.js";

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

The generators are deterministic: identical inputs produce identical outputs.
The check mode is the CI drift gate.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
