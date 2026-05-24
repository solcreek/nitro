import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { isCreekdDeployManifest } from "@solcreek/creekd-manifest";
import {
  spawnNodeServer,
  type SpawnedServer,
} from "../conformance/spawn-node-server.ts";

const here = dirname(fileURLToPath(import.meta.url));
const fixtureDir = resolve(here, "fixtures/nuxt-creekd");
const outDir = resolve(fixtureDir, ".output");

/**
 * Full-chain E2E: a real Nuxt 4 app → @solcreek/nitro/creekd → spawned server.
 *
 * Validates what the synthetic conformance suite cannot:
 *   - Nuxt's own build pipeline (auto-imports, #imports, page routing, SSR)
 *     accepts our preset as a drop-in for adapter-node.
 *   - SSR HTML is actually produced (not just hydration-only client paint).
 *   - The manifest we emit through Nuxt's build chain stays schema-valid.
 *
 * Gated behind RUN_E2E=1 because `nuxt build` is ~30s cold / ~10s warm and
 * pulls in the full Nuxt + Vite + Vue toolchain. The default `pnpm test`
 * skips this suite; CI runs it as a separate job, and `pnpm test:e2e`
 * runs it locally.
 */
const enabled = process.env.RUN_E2E === "1";

describe.runIf(enabled)("E2E: Nuxt 4 → @solcreek/nitro/creekd", () => {
  let server: SpawnedServer | undefined;

  beforeAll(async () => {
    // Build the Nuxt fixture. We shell out rather than calling Nuxt's API
    // directly so this mirrors what a real user runs (`nuxt build`) and
    // catches any breakage in the CLI surface, not just programmatic.
    await new Promise<void>((resolveBuild, rejectBuild) => {
      const child = spawn("pnpm", ["build"], {
        cwd: fixtureDir,
        stdio: "inherit",
        env: { ...process.env, NITRO_PRESET: undefined as unknown as string },
      });
      child.once("error", rejectBuild);
      child.once("exit", (code) => {
        if (code === 0) resolveBuild();
        else rejectBuild(new Error(`nuxt build exited with code ${code}`));
      });
    });

    expect(existsSync(resolve(outDir, "server/index.mjs"))).toBe(true);

    server = await spawnNodeServer(resolve(outDir, "server/index.mjs"), {}, 30_000);
  }, 180_000);

  afterAll(async () => {
    if (server) await server.close();
  });

  it("emits a schema-valid creekd manifest", async () => {
    const manifestPath = resolve(outDir, ".creek-creekd/manifest.json");
    expect(existsSync(manifestPath)).toBe(true);
    const parsed = JSON.parse(await readFile(manifestPath, "utf8"));
    expect(isCreekdDeployManifest(parsed)).toBe(true);
    expect(parsed.framework).toBe("nitro");
    expect(parsed.adapter?.name).toBe("@solcreek/nitro");
    expect(parsed.entrypoint).toBe("server/index.mjs");
  });

  it("serves Vue-rendered SSR HTML on /", async () => {
    const res = await fetch(server!.url);
    expect(res.status).toBe(200);
    const html = await res.text();
    // <div id="__nuxt"> is Nuxt's SSR root marker; presence proves the
    // server fully rendered the app rather than handing back an empty shell.
    expect(html).toMatch(/<div id="__nuxt">/);
    // Our pages/index.vue content must have made it into the rendered output.
    expect(html).toContain("Hello from @solcreek/nitro/creekd");
    expect(html).toMatch(/data-testid="rendered-at"/);
  });

  it("serves API routes via /api/health", async () => {
    const res = await fetch(new URL("/api/health", server!.url));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({
      ok: true,
      framework: "nuxt",
      adapter: "@solcreek/nitro/creekd",
    });
  });
});

describe.skipIf(enabled)("E2E: Nuxt suite (skipped — set RUN_E2E=1)", () => {
  it.skip("placeholder", () => undefined);
});
