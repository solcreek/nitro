import type { NitroConfig } from "nitro/types";

/**
 * `@solcreek/nitro/creekd` — long-running Node/Bun server target managed by creekd.
 *
 * Extends the in-tree `node-server` preset; the only Creek-specific work is
 * dropping a `.creek-creekd/manifest.json` next to the build output so creekd
 * knows how to spawn and health-check this app.
 *
 * Note: v3 keeps `defineNitroPreset` internal (`_presets.mjs`). External
 * presets are plain config objects with a `_meta` block — c12 picks them up
 * via the `extend` mechanism when a user writes `preset: '@solcreek/nitro/creekd'`.
 */
const preset = {
  extends: "node-server",
  hooks: {
    async compiled(nitro: unknown) {
      // TODO: write .creek-creekd/manifest.json via @solcreek/creekd-manifest
      void nitro;
    },
  },
  _meta: {
    name: "creekd",
    compatibilityDate: "2026-05-23",
  },
} satisfies NitroConfig & { _meta: { name: string; compatibilityDate: string } };

export default preset;
