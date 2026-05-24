import { describe, expect, it } from "vitest";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  describeIf,
  fixtureDir,
  getPresetTmpDir,
  setupTest,
  startServer,
  testNitro,
} from "./harness.ts";

/**
 * Vendor health check: confirms the vendored Nitro conformance harness
 * imports without error and points at our copy of the fixture.
 *
 * Does NOT run the full conformance suite — that is wired per preset in
 * sibling files (`creekd.test.ts`, `workers.test.ts`) and requires the
 * fixture's own toolchain deps (rolldown, scule, mono-jsx, etc.).
 */
describe("conformance harness vendoring", () => {
  it("exports the expected harness surface", () => {
    expect(typeof setupTest).toBe("function");
    expect(typeof startServer).toBe("function");
    expect(typeof testNitro).toBe("function");
    expect(typeof describeIf).toBe("function");
    expect(typeof getPresetTmpDir).toBe("function");
    expect(typeof fixtureDir).toBe("string");
  });

  it("fixtureDir resolves to our vendored copy with the expected layout", () => {
    expect(fixtureDir).toMatch(/test\/conformance\/fixture$/);
    expect(existsSync(fixtureDir)).toBe(true);
    expect(statSync(fixtureDir).isDirectory()).toBe(true);

    // Spot-check load-bearing files. If upstream restructures any of these
    // a re-sync will flag it here before deeper tests start to lie.
    for (const rel of [
      "nitro.config.ts",
      "package.json",
      "server.ts",
      "server/routes",
      "node_modules/@fixture/nitro-utils/package.json",
      "node_modules/@fixture/nitro-lib/package.json",
    ]) {
      expect(existsSync(resolve(fixtureDir, rel)), `fixture missing: ${rel}`).toBe(true);
    }
  });

  it("getPresetTmpDir returns a per-preset path", () => {
    const a = getPresetTmpDir("creekd");
    const b = getPresetTmpDir("creek-workers");
    expect(a).not.toBe(b);
    expect(a).toMatch(/creekd$/);
    expect(b).toMatch(/creek-workers$/);
  });
});
