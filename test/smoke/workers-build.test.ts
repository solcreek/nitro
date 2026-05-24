import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

import { createNitro, prepare, copyPublicAssets, build } from "nitro/builder";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Drives a full `nitro build` against the workers fixture and asserts the
 * Worker bundle + wrangler.json that the underlying `cloudflare-module`
 * preset is contractually required to produce. This is the bedrock that
 * `creek deploy` reads — if either disappears or changes shape, every
 * downstream Creek/Nuxt/Solid/Analog deploy breaks.
 *
 * NOTE: this test does NOT run the bundle through miniflare. That is the
 * job of the conformance suite (`test/conformance/`) once it is wired up.
 */
describe("workers preset: end-to-end build", () => {
  it("emits index.mjs + wrangler.json via cloudflare-module", async () => {
    const rootDir = resolve(here, "workers-fixture");
    const nitro = await createNitro({ rootDir, dev: false });
    try {
      await prepare(nitro);
      await copyPublicAssets(nitro);
      await build(nitro);

      const outDir = nitro.options.output.dir;
      const entry = resolve(outDir, "server/index.mjs");
      const wrangler = resolve(outDir, "server/wrangler.json");

      expect(existsSync(entry)).toBe(true);
      expect(existsSync(wrangler)).toBe(true);

      const parsed = JSON.parse(await readFile(wrangler, "utf8"));
      // Worker module shape: `main` should point at the entry file.
      expect(parsed.main).toBe("index.mjs");
      // cloudflare-module sets a name (falls back to project name or
      // a hard default) — assert presence rather than a specific value.
      expect(typeof parsed.name).toBe("string");
      expect(parsed.name.length).toBeGreaterThan(0);

      // The preset must NOT have written a sibling Creek manifest — its
      // absence here is the contract documented in src/presets/workers/index.ts.
      expect(existsSync(resolve(outDir, ".creek-workers"))).toBe(false);
      expect(existsSync(resolve(outDir, ".creek/adapter-output"))).toBe(false);
    } finally {
      await nitro.close();
    }
  }, 60_000);
});
