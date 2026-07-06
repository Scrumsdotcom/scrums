import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it, vi, afterEach } from "vitest";
import { strictParse } from "../src/cli-args.js";
import { hubAddCommand, hubCommand } from "../src/hub.js";

const execFileAsync = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.resolve(here, "..");

afterEach(() => {
  vi.restoreAllMocks();
});

describe("strictParse", () => {
  it("rejects unknown flags instead of ignoring them", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(strictParse("generate", ["--chek"], { check: { type: "boolean" } })).toBeUndefined();
  });

  it("accepts the flags it declares", () => {
    const parsed = strictParse("generate", ["--check"], { check: { type: "boolean" } });
    expect(parsed).toBeDefined();
    expect(parsed!.values.check).toBe(true);
  });

  it("rejects a string option that swallowed the next flag as its value", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const parsed = strictParse(
      "hub add",
      ["standard-hr", "--into", "--write"],
      { write: { type: "boolean" }, into: { type: "string" } },
      true,
    );
    expect(parsed).toBeUndefined();
  });

  it("rejects stray positionals when none are allowed", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(strictParse("validate", ["extra"], {})).toBeUndefined();
  });
});

describe("cac generate --chek (typo'd drift gate)", () => {
  it("exits non-zero without running the generator", async () => {
    // The one command CI relies on must fail closed on a typo — before this
    // guard, `generate --chek` silently ran the WRITE-mode generator.
    await expect(
      execFileAsync("npx", ["tsx", "src/index.ts", "generate", "--chek"], { cwd: cliRoot }),
    ).rejects.toMatchObject({ code: 2 });
  }, 60_000);
});

describe("hub add --into path traversal", () => {
  it("refuses a destination outside /company", async () => {
    const errors: string[] = [];
    vi.spyOn(console, "error").mockImplementation((msg) => errors.push(String(msg)));
    vi.spyOn(console, "log").mockImplementation(() => {});
    const ok = await hubAddCommand("standard-hr", { write: false, into: "../outside-repo" });
    expect(ok).toBe(false);
    expect(errors.join("\n")).toMatch(/resolves outside \/company/);
  });

  it("refuses an absolute destination outside /company", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    const ok = await hubAddCommand("standard-hr", { write: false, into: "/tmp/elsewhere" });
    expect(ok).toBe(false);
  });

  it("still allows a destination inside /company (dry-run)", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const ok = await hubAddCommand("standard-hr", {
      write: false,
      into: "company/domains/test-scratch/hr",
    });
    expect(ok).toBe(true);
  });

  it("hubCommand rejects unknown flags on add", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const ok = await hubCommand(["add", "standard-hr", "--writ"]);
    expect(ok).toBe(false);
  });
});
