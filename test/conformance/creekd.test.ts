import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { isCreekdDeployManifest } from "@solcreek/creekd-manifest";
import { setupTest } from "./harness.ts";

/**
 * Drives the vendored Nitro conformance fixture against our creekd preset.
 *
 * For 0.2.0 this is the minimum integration: prove `setupTest` accepts
 * `preset: "@solcreek/nitro/creekd"`, the c12 extend resolution still
 * works against the full ~100-file fixture, the build completes, and
 * our manifest lands at the expected path.
 *
 * The full `testNitro(ctx, ...)` matrix (routing, route rules, streaming,
 * SWR cache, prerender, security regressions, ...) is the next step.
 * Wiring that requires a node-process spawner around `server/index.mjs`
 * and is deliberately deferred so this commit stays scoped to "harness
 * accepts our preset".
 */
describe("nitro:preset:@solcreek/nitro/creekd (vendored fixture)", async () => {
  const ctx = await setupTest("@solcreek/nitro/creekd", {
    compatibilityDate: "2026-05-23",
  });

  it("setupTest produces a valid context", () => {
    expect(ctx.preset).toBe("@solcreek/nitro/creekd");
    expect(ctx.outDir).toMatch(/@solcreek\/nitro\/creekd\/\.output$/);
    expect(ctx.isWorker).toBe(false);
    expect(ctx.isDev).toBe(false);
    expect(existsSync(ctx.outDir)).toBe(true);
  });

  it("Nitro resolved our preset (not a built-in)", () => {
    // _meta.name from src/presets/creekd/index.ts.
    expect(ctx.nitro?.options.preset).toBe("creekd");
    // creekd extends node-server.
    expect(ctx.nitro?.options.serveStatic).toBe(true);
  });

  it("build produced server/index.mjs", () => {
    expect(existsSync(resolve(ctx.outDir, "server/index.mjs"))).toBe(true);
  });

  it("our compiled hook emitted a valid creekd manifest", async () => {
    const manifestPath = resolve(ctx.outDir, ".creek-creekd/manifest.json");
    expect(existsSync(manifestPath)).toBe(true);
    const parsed = JSON.parse(await readFile(manifestPath, "utf8"));
    expect(isCreekdDeployManifest(parsed)).toBe(true);
    expect(parsed.target).toBe("creekd");
    expect(parsed.entrypoint).toBe("server/index.mjs");
  });
}, 120_000);
