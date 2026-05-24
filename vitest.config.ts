import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    // Conformance tests run real `nitro build` + spawn servers; give them room.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
