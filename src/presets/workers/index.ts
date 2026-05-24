import type { NitroConfig } from "nitro/types";

/**
 * `@solcreek/nitro/workers` — Cloudflare Workers target for the Creek platform.
 *
 * Extends `cloudflare-module`; Creek-specific work is the wrangler/resource
 * manifest emitted in `compiled` so `creek deploy` can wire D1/R2/KV/Queues.
 */
const preset = {
  extends: "cloudflare-module",
  hooks: {
    async compiled(nitro: unknown) {
      // TODO: emit creek.toml / resource-binding manifest
      void nitro;
    },
  },
  _meta: {
    name: "creek-workers",
    compatibilityDate: "2026-05-23",
  },
} satisfies NitroConfig & { _meta: { name: string; compatibilityDate: string } };

export default preset;
