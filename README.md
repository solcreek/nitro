# @solcreek/nitro

[![npm](https://img.shields.io/npm/v/@solcreek/nitro?color=blue)](https://www.npmjs.com/package/@solcreek/nitro)
[![License](https://img.shields.io/badge/license-Apache%202.0-green)](LICENSE)

**[Nitro](https://nitro.build) preset for [Creek](https://creek.dev).** Deploy any Nitro-powered app to Cloudflare Workers (managed Creek) or self-hosted [creekd](https://github.com/solcreek/creekd) with a one-line config change.

Because [Nuxt](https://nuxt.com), [SolidStart](https://start.solidjs.com), [TanStack Start](https://tanstack.com/start), and [Analog](https://analogjs.org) all build on Nitro, this single preset covers all four frameworks.

## Install

```sh
npm install -D @solcreek/nitro nitro
```

`nitro` is a peer dependency (`>=3.0.260522-beta`).

## Two targets, one package

| Target                            | Subpath                       | Underlying preset    | When to pick it                                                  |
| --------------------------------- | ----------------------------- | -------------------- | ---------------------------------------------------------------- |
| **Cloudflare Workers** *(managed Creek edge)* | `@solcreek/nitro/workers` | `cloudflare-module` | You want one-command global edge deploys via `creek deploy`.     |
| **creekd** *(self-host, Linux supervisor)* | `@solcreek/nitro/creekd`  | `node-server`        | You want to run the app yourself on a VPS with cgroup isolation. |

Swap targets by changing one string — same source, different `nitro.config.ts`.

## Workers usage

```ts
// nitro.config.ts
export default defineNitroConfig({
  preset: "@solcreek/nitro/workers",
  compatibilityDate: "2026-05-23",
  cloudflare: {
    wrangler: {
      compatibility_flags: ["nodejs_compat"],
    },
  },
});
```

Then:

```sh
nitro build      # produces .output/server/{index.mjs, wrangler.json}
creek deploy     # ships it
```

For Nuxt: put the same block under `nitro: { ... }` in `nuxt.config.ts`. Same for SolidStart, TanStack Start, and Analog (their config keys differ; the Nitro options inside are identical).

### Resource bindings

D1, R2, KV, Queues, AI, Durable Objects, cron triggers — everything goes through the standard Nitro `cloudflare.wrangler` namespace. Creek's deploy pipeline reads the generated `wrangler.json` directly; nothing adapter-specific to learn.

## creekd usage

```ts
// nitro.config.ts
export default defineNitroConfig({
  preset: "@solcreek/nitro/creekd",
  compatibilityDate: "2026-05-23",
});
```

Build, then point creekctl at the manifest:

```sh
nitro build
creekctl up myapp --from .output/.creek-creekd/manifest.json
```

The build emits a `.creek-creekd/manifest.json` validated against the [`@solcreek/creekd-manifest`](https://www.npmjs.com/package/@solcreek/creekd-manifest) schema. creekd reads it to know which runtime to spawn (`node` / `bun` / `deno`), which port to bind, and which health-probe path to hit.

### Overrides

```ts
export default defineNitroConfig({
  preset: "@solcreek/nitro/creekd",
  // Custom namespace, read by @solcreek/nitro at build time.
  // @ts-expect-error not in NitroConfig — it's our own.
  creek: {
    port: 8080,                  // default: 3000
    runtime: "bun",              // default: "node"
    healthCheckPath: "/healthz", // default: "/_creek/health"
  },
});
```

## Design notes

### Why creekd needs a manifest but Workers does not

- **creekd** runs outside Cloudflare. `creekctl` needs a *process contract* telling it which runtime to spawn, what port, what health probe. That contract is `.creek-creekd/manifest.json`.
- **Workers** deploys via Wrangler / CF API. The entire configuration is already in `wrangler.json` — adding a sibling manifest would create a no-op consumer and a sync-drift hazard.

So `@solcreek/nitro/workers` is a deliberately thin wrapper around `cloudflare-module` with no `compiled` hook. The thinness is the feature.

### Why one package and not two

Both presets share the same intended audience ("I have a Nitro app and want it on Creek") and ~80% of the supporting code (env handling, manifest shaping, fixture infrastructure). Splitting into `@solcreek/nitro-workers` + `@solcreek/nitro-creekd` would force users to pick a target before installing, and version-skew the shared layer.

## Conformance

The package ships with a vendored copy of Nitro's official preset conformance harness (`test/conformance/`, sourced from `nitrojs/nitro` at `v3.0.260522-beta`). Smoke tests in `test/smoke/` run the full `nitro build` against minimal fixtures for both targets to validate the build contracts.

## License

Apache-2.0
