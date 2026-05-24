import type { NitroConfig } from "nitro/types";
import { writeManifest, type CreekdPresetOptions } from "./manifest.js";

/**
 * `@solcreek/nitro/creekd` — long-running Node/Bun server target managed by creekd.
 *
 * Extends the in-tree `node-server` preset and drops a creekd deploy
 * manifest next to the build output. `creekctl up --from <output>/.creek-creekd/manifest.json`
 * reads it to spawn and supervise the process.
 *
 * User overrides live under `nitro.options.creek` (custom namespace, not
 * type-checked by Nitro). See {@link CreekdPresetOptions} for the shape.
 */
const preset = {
  extends: "node-server",
  hooks: {
    async compiled(nitro: {
      options: {
        output: { dir: string; serverDir: string };
        // Custom namespace; user supplies via nitro.config.ts.
        creek?: CreekdPresetOptions;
        buildId?: string;
      };
    }) {
      const outputDir = nitro.options.output.dir;
      // node-server preset writes the entry to <serverDir>/index.mjs;
      // entrypoint in the manifest is relative to the project root so creekd
      // (which cwd's into the deploy dir) can spawn it directly.
      const entrypoint = "server/index.mjs";
      await writeManifest({
        outputDir,
        entrypoint,
        buildId: nitro.options.buildId ?? new Date().toISOString(),
        overrides: nitro.options.creek,
      });
    },
  },
  _meta: {
    name: "creekd",
    compatibilityDate: "2026-05-23",
  },
} satisfies NitroConfig & { _meta: { name: string; compatibilityDate: string } };

export default preset;
export type { CreekdPresetOptions } from "./manifest.js";
