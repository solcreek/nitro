import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

import { createNitro, prepare, copyPublicAssets, build } from "nitro/builder";
import { isCreekdDeployManifest } from "@solcreek/creekd-manifest";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Drives a full `nitro build` against the creekd fixture and asserts that
 * the `compiled` hook produced `.creek-creekd/manifest.json` with valid
 * contents. This is the smallest end-to-end exercise of the preset.
 */
describe("creekd preset: end-to-end build", () => {
  it("emits a valid creekd manifest into the build output", async () => {
    const rootDir = resolve(here, "creekd-fixture");
    const nitro = await createNitro({ rootDir, dev: false });
    try {
      await prepare(nitro);
      await copyPublicAssets(nitro);
      await build(nitro);

      const outDir = nitro.options.output.dir;
      expect(existsSync(resolve(outDir, "server/index.mjs"))).toBe(true);

      const manifestPath = resolve(outDir, ".creek-creekd/manifest.json");
      expect(existsSync(manifestPath)).toBe(true);

      const parsed = JSON.parse(await readFile(manifestPath, "utf8"));
      expect(isCreekdDeployManifest(parsed)).toBe(true);
      expect(parsed.target).toBe("creekd");
      expect(parsed.runtime).toBe("node");
      expect(parsed.entrypoint).toBe("server/index.mjs");
    } finally {
      await nitro.close();
    }
  }, 60_000);
});
