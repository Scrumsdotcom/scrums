// Strict CLI flag parsing shared by every subcommand.
//
// The framework's creed is dry-run-mandatory, so flag parsing must fail
// closed: a typo'd `--chek` must be an error, never a silent fall-through
// into write mode.

import { parseArgs } from "node:util";

export type ParseOptions = Record<string, { type: "boolean" | "string" }>;

export interface ParsedCli {
  values: Record<string, string | boolean | undefined>;
  positionals: string[];
}

/**
 * Parse `args` strictly: unknown flags, missing values, and stray
 * positionals are errors, not silent no-ops. Returns undefined (after
 * printing the problem) when parsing fails.
 */
export function strictParse(
  cmd: string,
  args: string[],
  options: ParseOptions,
  allowPositionals = false,
): ParsedCli | undefined {
  let parsed: ParsedCli;
  try {
    parsed = parseArgs({ args, options, strict: true, allowPositionals }) as ParsedCli;
  } catch (e) {
    console.error(`${cmd}: ${(e as Error).message}`);
    console.error(`Run 'cac help' for usage.`);
    return undefined;
  }
  // parseArgs happily consumes a following flag as a string option's value
  // (`--into --write` → into="--write"). That is always a mistake.
  for (const [key, value] of Object.entries(parsed.values)) {
    if (typeof value === "string" && value.startsWith("--")) {
      console.error(`${cmd}: option '--${key}' is missing a value (got '${value}').`);
      return undefined;
    }
  }
  return parsed;
}
