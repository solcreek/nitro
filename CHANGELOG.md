# Changelog

## Unreleased

### Verified

- **Nuxt 4 (`nitropack@^2.13`) works** — confirmed via an end-to-end Nuxt 4.4.6
  fixture (`test/e2e/fixtures/nuxt-creekd/`) that builds with our preset,
  emits a schema-valid manifest, and serves Vue SSR HTML + API routes from
  the spawned `server/index.mjs`. The preset is the same code as for Nitro v3
  — no separate v2 path needed.

### Changed

- `peerDependencies` now lists **both** `nitropack@>=2.13.0` and
  `nitro@>=3.0.260522-beta`, each marked optional via
  `peerDependenciesMeta`. Either one satisfies the install.

### Internal

- `test/e2e/` infrastructure: full chain (real `nuxt build` → spawned node
  process → HTTP assertions) gated behind `RUN_E2E=1` so the heavy Nuxt
  toolchain stays out of the default `pnpm test`. Run with `pnpm test:e2e`.
- Workspace-level pnpm override pins `estree-walker` to `2.0.2` to keep the
  Nitro NFT trace deterministic in a workspace that also installs vitest
  (which transitively pulls v3.0.3). Real users in isolated Nuxt projects
  don't need this — the conflict is specific to our test layout.

### Documentation

- README adds a framework support matrix (Nuxt 4 ✅, bare Nitro v3 ✅,
  Solid/TanStack/Analog 🟡 untested, SolidStart 2 ❌ out of scope after they
  dropped Nitro for srvx + h3 directly).

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
