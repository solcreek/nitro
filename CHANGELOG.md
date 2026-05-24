# Changelog

## 0.4.0 — 2026-05-24

### Verified

Two more frameworks now have full end-to-end suites alongside Nuxt 4:

- **SolidStart 1.3.2** (`@solidjs/start` → Vinxi → `nitropack@^2.13`)
  via `test/e2e/fixtures/solidstart-creekd/`. Real `vinxi build` →
  spawned `server/index.mjs` → SSR HTML + `/api/health` route both
  succeed.
- **TanStack Start 1.168.11** (`@tanstack/react-start` →
  `nitro/vite` plugin → **`nitro@^3.0`**) via
  `test/e2e/fixtures/tanstack-creekd/`. **First mainstream framework
  on Nitro v3.** Proves our v3 preset path isn't future-only —
  it runs against shipping framework code today.

### Test infrastructure

- `spawnNodeServer()` and `RUN_E2E=1` gating already in place from
  0.3.0; new fixtures follow the same pattern (vendored app, real
  CLI build, spawned process, HTTP assertions).
- TanStack Start fixture pins `NODE_ENV=production` in the build
  spawn because vitest sets `NODE_ENV=test` which makes the Vite
  React plugin choose the dev JSX runtime — that bundle then throws
  `jsxDEV is not a function` at runtime.

### Known limitations

- **Analog 2.5.2** is blocked in mixed workspaces:
  `@analogjs/vite-plugin-nitro@2.5.2` imports
  `createEvent` from `h3@1`, but Nitro v3 (also in our workspace)
  uses `h3@2` where that export was renamed. Pure Analog projects
  outside a v2/v3 mixed tree may still work; we don't verify either
  way until the upstream version skew settles.
- TanStack Start E2E asserts SSR HTML only — the server-route API
  surface in `@tanstack/react-start` 1.168+ is in flux (no
  `createServerFileRoute`, no documented Nitro `server/api/*`
  passthrough yet), so route assertions are out of scope until it
  stabilises.

## 0.3.0 — 2026-05-24

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
