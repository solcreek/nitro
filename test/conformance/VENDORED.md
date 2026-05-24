# Vendored Nitro Conformance Harness

The files in this directory are **vendored verbatim** from the upstream
[`nitrojs/nitro`](https://github.com/nitrojs/nitro) repository. Nitro does not
publish its test harness as an installable package (no `@nitrojs/test-utils` or
equivalent), so the only way to run the same conformance suite that gates
official in-tree presets is to copy the harness into your own repo.

## Source

| Item   | Value                                                                 |
| ------ | --------------------------------------------------------------------- |
| Repo   | https://github.com/nitrojs/nitro                                      |
| Tag    | `v3.0.260522-beta`                                                    |
| SHA    | `5d21dd28c6209b7858388f9174cfb8088de349e8`                            |
| Paths  | `test/tests.ts` → `harness.ts`<br>`test/fixture/` → `fixture/`        |
| License | Apache-2.0 (carried over from upstream)                              |

## What lives here

- **`harness.ts`** — `setupTest()`, `startServer()`, `testNitro()`, `describeIf()`,
  `getPresetTmpDir()`. The 892-line workhorse that drives the fixture app through
  every conformance scenario (routing, route rules, streaming, SWR cache, prerender,
  WASM, errors, security regressions, etc.) for a given preset.
- **`fixture/`** — the shared Nitro app that every preset must pass against.
  Includes a committed `node_modules/@fixture/*` set of dummy packages used to
  validate external module tracing (these are NOT npm-installed; they ship in git).

## Re-sync procedure

When upgrading the pinned Nitro version (see root `package.json`):

```sh
git -C /tmp clone --depth=1 --branch=<NEW_NITRO_TAG> https://github.com/nitrojs/nitro.git
cp /tmp/nitro/test/tests.ts                test/conformance/harness.ts
rm -rf                                     test/conformance/fixture
cp -R /tmp/nitro/test/fixture              test/conformance/fixture
# update Source table above with the new tag + SHA
```

Then re-run `pnpm test:conformance` to surface any harness API changes
(e.g. new `Context` fields, signature changes in `testNitro`).

## Local modifications

**`fixture/package.json`** has three differences from upstream — all necessary
to make the fixture installable as a sibling workspace package alongside
`@solcreek/nitro`:

1. `name` is renamed from `nitro-test-fixture` to `@solcreek-test/conformance-fixture`
   so it can live under the `@solcreek-test/` scope alongside other test fixtures
   without colliding with the upstream npm name.
2. `devDependencies` adds `"@solcreek/nitro": "workspace:*"` so the fixture
   resolves `preset: "@solcreek/nitro/creekd"` and `/workers` from its own
   `node_modules`.
3. `devDependencies.nitro` switches from `"workspace:*"` (which only works inside
   the nitrojs/nitro monorepo) to our pinned `"3.0.260522-beta"`.

On re-sync, redo these three lines manually. The body of the fixture (config,
routes, plugins, vendored `@fixture/*` deps) MUST stay byte-identical to
upstream — that's what makes the harness contract meaningful.

**Do not edit `harness.ts` or anything under `fixture/server/` in place** — keep
them aligned with upstream so re-syncs stay trivial. If a test must be skipped
or extended for our presets, wrap or call the harness from a sibling test file
(e.g. `creekd.test.ts`, `workers.test.ts`) rather than patching `harness.ts`.
