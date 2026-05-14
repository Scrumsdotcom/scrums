import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

// cli/src -> cli/ -> repo root
export const REPO_ROOT = path.resolve(here, "..", "..");
export const SCHEMA_DIR = path.join(REPO_ROOT, "schemas");
export const COMPANY_DIR = path.join(REPO_ROOT, "company");
export const GENERATED_DIR = path.join(REPO_ROOT, "generated");
export const HUB_DIR = path.join(REPO_ROOT, "hub");
