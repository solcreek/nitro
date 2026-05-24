import { describe, expect, it } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

import { isCreekdDeployManifest } from "@solcreek/creekd-manifest";
import { buildManifest, writeManifest } from "./manifest.js";

describe("creekd manifest", () => {
  describe("buildManifest", () => {
    it("returns a defaults-filled, validator-passing manifest", () => {
      const m = buildManifest({
        outputDir: "/tmp/x",
        entrypoint: "server/index.mjs",
        buildId: "test-build-1",
      });
      expect(isCreekdDeployManifest(m)).toBe(true);
      expect(m.target).toBe("creekd");
      expect(m.runtime).toBe("node");
      expect(m.port).toBe(3000);
      expect(m.health_check_path).toBe("/_creek/health");
      expect(m.entrypoint).toBe("server/index.mjs");
      expect(m.buildId).toBe("test-build-1");
      expect(m.framework).toBe("nitro");
      expect(m.adapter?.name).toBe("@solcreek/nitro");
    });

    it("respects user overrides", () => {
      const m = buildManifest({
        outputDir: "/tmp/x",
        entrypoint: "server/index.mjs",
        buildId: "build-2",
        overrides: { port: 8080, runtime: "bun", healthCheckPath: "/healthz" },
      });
      expect(m.port).toBe(8080);
      expect(m.runtime).toBe("bun");
      expect(m.health_check_path).toBe("/healthz");
    });
  });

  describe("writeManifest", () => {
    it("creates .creek-creekd/manifest.json under outputDir with valid contents", async () => {
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), "creekd-test-"));
      try {
        const out = await writeManifest({
          outputDir: dir,
          entrypoint: "server/index.mjs",
          buildId: "write-test",
        });
        expect(out).toBe(path.join(dir, ".creek-creekd", "manifest.json"));

        const raw = await fs.readFile(out, "utf8");
        const parsed = JSON.parse(raw);
        expect(isCreekdDeployManifest(parsed)).toBe(true);
        expect(parsed.buildId).toBe("write-test");
        // Trailing newline by convention (POSIX-friendly text files).
        expect(raw.endsWith("\n")).toBe(true);
      } finally {
        await fs.rm(dir, { recursive: true, force: true });
      }
    });
  });
});
