import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    // E2E tests are gated behind RUN_E2E=1 (see test/e2e/*.test.ts) — but
    // even loading the file forces vitest to resolve the Nuxt fixture's
    // tsconfig. Exclude unless explicitly opted in to keep `pnpm test`
    // independent of the e2e toolchain.
    exclude:
      process.env.RUN_E2E === "1"
        ? ["**/node_modules/**"]
        : ["**/node_modules/**", "test/e2e/**"],
    // Conformance tests run real `nitro build` + spawn servers; give them room.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
