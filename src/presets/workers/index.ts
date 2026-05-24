import { defineNitroPreset } from "nitro/presets";

/**
 * `@solcreek/nitro/workers` — Cloudflare Workers target for the Creek platform.
 *
 * Extends `cloudflare-module`; Creek-specific work is the wrangler/resource
 * manifest emitted in `compiled` so `creek deploy` can wire D1/R2/KV/Queues.
 */
export default defineNitroPreset(
  {
    extends: "cloudflare-module",
    hooks: {
      async compiled(nitro) {
        // TODO: emit creek.toml / resource-binding manifest
        void nitro;
      },
    },
  },
  {
    name: "creek-workers",
    compatibilityDate: "2026-05-23",
  },
);
