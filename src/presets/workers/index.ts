import type { NitroConfig } from "nitro/types";

/**
 * `@solcreek/nitro/workers` — Cloudflare Workers target for the Creek platform.
 *
 * Extends Nitro's in-tree `cloudflare-module` preset and does **no further
 * work of its own**. That's deliberate, not unfinished:
 *
 *   - `cloudflare-module` already emits `.output/server/index.mjs` and
 *     `.output/server/wrangler.json` with bindings, compatibility flags,
 *     cron triggers, and Durable Object class exports.
 *   - `creek deploy` consumes `wrangler.json` + `creek.toml` directly as
 *     the source of truth for what to provision. It does not read any
 *     adapter-side manifest.
 *   - Writing a sibling `.creek-workers/manifest.json` would create
 *     a no-op consumer and a sync-drift hazard between two files that
 *     have to agree forever.
 *
 * Contrast with `@solcreek/nitro/creekd`, which DOES emit a manifest:
 * creekd runs outside Cloudflare and needs a process contract telling
 * `creekctl` what to spawn. Workers has no such gap — the Worker bundle
 * + wrangler.json IS the contract.
 *
 * Users configure resource bindings, compatibility, cron, etc. through
 * Nitro's standard `cloudflare.wrangler` namespace:
 *
 *     export default defineNitroConfig({
 *       preset: "@solcreek/nitro/workers",
 *       cloudflare: {
 *         wrangler: {
 *           compatibility_date: "2026-05-23",
 *           compatibility_flags: ["nodejs_compat"],
 *         },
 *       },
 *     });
 */
const preset = {
  extends: "cloudflare-module",
  _meta: {
    name: "creek-workers",
    compatibilityDate: "2026-05-23",
  },
} satisfies NitroConfig & { _meta: { name: string; compatibilityDate: string } };

export default preset;
