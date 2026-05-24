import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createNitro } from "nitro/builder";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Smoke test for the load-bearing assumption that `preset: '@solcreek/nitro/<name>'`
 * resolves through c12's extend mechanism (Nitro v3 doesn't search npm modules in
 * its own resolvePreset — it relies on c12 to import the layer).
 *
 * If this test passes, the entire subpath-exports strategy is viable. If it
 * fails, fallback is publishing two separate packages (@solcreek/nitro-workers
 * and @solcreek/nitro-creekd) as top-level package names.
 */
describe("subpath-exports preset resolution", () => {
  it("resolves '@solcreek/nitro/creekd' to our preset (extends node-server)", async () => {
    const rootDir = resolve(here, "creekd-fixture");
    const nitro = await createNitro({ rootDir, dev: false });
    try {
      // _meta.name from src/presets/creekd/index.ts is "creekd".
      expect(nitro.options.preset).toBe("creekd");
      // creekd extends node-server, which sets serveStatic=true. If c12 picked
      // up our preset and merged inheritance correctly, this should hold.
      expect(nitro.options.serveStatic).toBe(true);
      // Output entry should be the node-server entry (long-running process).
      expect(nitro.options.entry).toMatch(/node-server/);
    } finally {
      await nitro.close();
    }
  });

  it("resolves '@solcreek/nitro/workers' to our preset (extends cloudflare-module)", async () => {
    const rootDir = resolve(here, "workers-fixture");
    const nitro = await createNitro({ rootDir, dev: false });
    try {
      expect(nitro.options.preset).toBe("creek-workers");
      // cloudflare-module extends base-worker → noExternals: true, node: false.
      expect(nitro.options.noExternals).toBe(true);
      expect(nitro.options.node).toBe(false);
    } finally {
      await nitro.close();
    }
  });
});
