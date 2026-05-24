import { defineNitroPreset } from "nitro/presets";

/**
 * `@solcreek/nitro/creekd` — long-running Node/Bun server target managed by creekd.
 *
 * Extends the in-tree `node-server` preset; the only Creek-specific work is
 * dropping a `.creek-creekd/manifest.json` next to the build output so creekd
 * knows how to spawn and health-check this app.
 */
export default defineNitroPreset(
  {
    extends: "node-server",
    hooks: {
      async compiled(nitro) {
        // TODO: write .creek-creekd/manifest.json via @solcreek/creekd-manifest
        // Placeholder: smoke test only verifies the preset resolves.
        void nitro;
      },
    },
  },
  {
    name: "creekd",
    compatibilityDate: "2026-05-23",
  },
);
