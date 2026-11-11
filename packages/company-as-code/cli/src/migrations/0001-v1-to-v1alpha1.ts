import type { Migration } from "./index.js";

/**
 * The first document version was named `v1` while the framework was a 0.x
 * seed whose schemas still changed in breaking ways. `v1` promises stability
 * the framework did not yet offer, so the format was renamed to `v1alpha1`
 * before the first public release. The shape of the documents is unchanged;
 * only the version string moves.
 */
export const m0001: Migration = {
  id: "0001",
  from: "company-as-code/v1",
  to: "company-as-code/v1alpha1",
  summary: "rename the pre-release document version from v1 to v1alpha1 (no shape change)",
  apply(text: string): string {
    return text.replace(
      /^(\s*(?:apiVersion|frameworkVersion):\s*["']?)company-as-code\/v1(["']?\s*(?:#.*)?)$/gm,
      "$1company-as-code/v1alpha1$2",
    );
  },
};
