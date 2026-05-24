# Changelog

## 0.1.0 — 2026-05-23

Initial release. Two presets for [Nitro](https://nitro.build) `>=3.0.260522-beta`:

### `@solcreek/nitro/workers`

- Targets Cloudflare Workers via Creek's managed edge.
- Thin wrapper around Nitro's in-tree `cloudflare-module` preset; no `compiled` hook by design.
- `creek deploy` reads the standard `.output/server/wrangler.json` directly.

### `@solcreek/nitro/creekd`

- Targets self-hosted [creekd](https://github.com/solcreek/creekd) supervisors.
- Extends Nitro's in-tree `node-server` preset.
- Emits `.output/.creek-creekd/manifest.json` validated against the [`@solcreek/creekd-manifest`](https://www.npmjs.com/package/@solcreek/creekd-manifest) schema (`v0.1.0`).
- User overrides via `nitro.options.creek`: `port` (default `3000`), `runtime` (`node` | `bun` | `deno`, default `node`), `healthCheckPath` (default `/_creek/health`).

### Tooling

- Vendored Nitro conformance harness at `test/conformance/` (sourced from `nitrojs/nitro@v3.0.260522-beta`, SHA `5d21dd28`). Wiring it to per-preset suites is planned for `0.2.0`.
- 10 passing tests covering preset resolution (via c12 subpath imports), manifest schema, and end-to-end `nitro build` artifacts for both targets.
