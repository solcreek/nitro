# Changelog

## 0.2.0 — 2026-05-24

### Conformance

The `@solcreek/nitro/creekd` preset now passes the full Nitro v3 conformance
matrix (56 scenarios from `nitrojs/nitro@v3.0.260522-beta`, SHA `5d21dd28`):
routing (dynamic params, wildcards, route groups), route rules (redirect /
proxy / CORS / basicAuth / SWR / ISR), streaming, prerender, error handling
with source-map remapping, async context, runtimeConfig env, cache, WASM,
database, nodejs compatibility, security regressions. Same quality bar as
Nitro's in-tree `node-server` preset.

### Added

- `test/conformance/creekd.test.ts` — drives the vendored 102-file fixture
  against our preset via the upstream `setupTest` / `testNitro` harness.
- `test/conformance/spawn-node-server.ts` — child-process helper that spawns
  the built `server/index.mjs` on an ephemeral port under
  `--enable-source-maps`, with a 500ms SIGTERM→SIGKILL escalation so test
  teardown stays crisp despite srvx keep-alive connections.

### Internal

- Conformance fixture is now a workspace member (`@solcreek-test/conformance-fixture`)
  so it can depend on `@solcreek/nitro` via `workspace:*`. Three local mods
  to vendored files are recorded in `test/conformance/VENDORED.md` for re-sync.
- Root devDeps gained the fixture's build-time chain: `rolldown`, `scule`,
  `mono-jsx`, `unwasm`, `vite`.

### Not yet

- Workers preset has its own build-output test (smoke) but no conformance
  run against miniflare yet. Tracking for `0.3.0`.
- Dev-mode parity: there is no `creekd-dev` / `workers-dev` yet. Dev mode
  currently falls back to `nitro-dev` with the standard "Using ... emulation"
  log message.

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
