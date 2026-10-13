import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    // Several suites write scratch files into the shared /company tree while
    // others regenerate from it. Run files one at a time so they never race.
    fileParallelism: false,
  },
});
