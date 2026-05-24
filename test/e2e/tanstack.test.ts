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
const fixtureDir = resolve(here, "fixtures/tanstack-creekd");
const outDir = resolve(fixtureDir, ".output");

/**
 * Full-chain E2E: a real TanStack Start 1.168 app on **Nitro v3** (via the
 * `nitro/vite` plugin) → @solcreek/nitro/creekd → spawned server.
 *
 * TanStack Start is the first mainstream framework to migrate to Nitro v3
 * (Nuxt 4 and Analog are still on nitropack v2). This test is the proof
 * that our v3 preset isn't future-only — it works with shipping framework
 * code today.
 *
 * Server routes are NOT asserted here: the post-Vinxi TanStack Start
 * 1.168+ server-route API is in flux (no `createServerFileRoute`, no
 * stable Nitro `server/api/*` passthrough as of writing). The SSR HTML
 * path is the load-bearing assertion.
 */
const enabled = process.env.RUN_E2E === "1";

describe.runIf(enabled)("E2E: TanStack Start 1.168 (Nitro v3) → @solcreek/nitro/creekd", () => {
  let server: SpawnedServer | undefined;

  beforeAll(async () => {
    await new Promise<void>((resolveBuild, rejectBuild) => {
      const child = spawn("pnpm", ["build"], {
        cwd: fixtureDir,
        stdio: "inherit",
        // Override vitest's NODE_ENV=test — vite's React plugin picks the
        // dev JSX runtime when NODE_ENV !== production, and the resulting
        // bundle throws `jsxDEV is not a function` at runtime.
        env: { ...process.env, NODE_ENV: "production" },
      });
      child.once("error", rejectBuild);
      child.once("exit", (code) => {
        if (code === 0) resolveBuild();
        else rejectBuild(new Error(`vite build exited with code ${code}`));
      });
    });
    expect(existsSync(resolve(outDir, "server/index.mjs"))).toBe(true);
    server = await spawnNodeServer(resolve(outDir, "server/index.mjs"), {}, 30_000);
  }, 240_000);

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
  });

  it("serves React SSR HTML on /", async () => {
    const res = await fetch(server!.url);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Hello from @solcreek/nitro/creekd");
    expect(html).toMatch(/data-testid="hero"/);
    expect(html).toMatch(/data-testid="rendered-at"/);
  });
});
