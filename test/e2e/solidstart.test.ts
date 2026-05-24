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
const fixtureDir = resolve(here, "fixtures/solidstart-creekd");
const outDir = resolve(fixtureDir, ".output");

/**
 * Full-chain E2E: a real SolidStart 1.x app (Vinxi → nitropack v2) →
 * @solcreek/nitro/creekd → spawned server. Exercises Vinxi's pass-through
 * of `server.preset` to nitropack and proves our preset works for a second
 * mainstream framework on the v2 engine, alongside Nuxt 4.
 */
const enabled = process.env.RUN_E2E === "1";

describe.runIf(enabled)("E2E: SolidStart 1.x → @solcreek/nitro/creekd", () => {
  let server: SpawnedServer | undefined;

  beforeAll(async () => {
    await new Promise<void>((resolveBuild, rejectBuild) => {
      const child = spawn("pnpm", ["build"], {
        cwd: fixtureDir,
        stdio: "inherit",
      });
      child.once("error", rejectBuild);
      child.once("exit", (code) => {
        if (code === 0) resolveBuild();
        else rejectBuild(new Error(`vinxi build exited with code ${code}`));
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

  it("serves Solid SSR HTML on /", async () => {
    const res = await fetch(server!.url);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Hello from @solcreek/nitro/creekd");
    expect(html).toMatch(/data-testid="rendered-at"/);
  });

  it("serves API routes via /api/health", async () => {
    const res = await fetch(new URL("/api/health", server!.url));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      framework: "solidstart",
      adapter: "@solcreek/nitro/creekd",
    });
  });
});
