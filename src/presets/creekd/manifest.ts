import * as fs from "node:fs/promises";
import * as path from "node:path";
import { createRequire } from "node:module";

import {
  isCreekdDeployManifest,
  type CreekdDeployManifest,
  type CreekdRuntime,
} from "@solcreek/creekd-manifest";

const require = createRequire(import.meta.url);
const adapterPackage = require("../../../package.json") as {
  name?: string;
  version?: string;
};

/**
 * User-tunable knobs read from `nitro.options.creek` in the user's
 * nitro.config.ts. All fields are optional — sensible defaults are
 * picked when omitted.
 *
 *     // nitro.config.ts
 *     export default defineNitroConfig({
 *       preset: "@solcreek/nitro/creekd",
 *       // @ts-expect-error custom namespace, not in NitroConfig
 *       creek: { port: 8080, runtime: "bun" },
 *     });
 */
export interface CreekdPresetOptions {
  /** TCP port the built server should listen on. Default: 3000. */
  port?: number;
  /** Runtime to spawn (`node`, `bun`, `deno`). Default: `node`. */
  runtime?: CreekdRuntime;
  /** HTTP liveness probe path baked into the manifest. Default: `/_creek/health`. */
  healthCheckPath?: string;
}

const DEFAULTS: Required<CreekdPresetOptions> = {
  port: 3000,
  runtime: "node",
  healthCheckPath: "/_creek/health",
};

export interface BuildManifestInput {
  /** Resolved Nitro output dir (e.g. `.output`). Manifest is written under here. */
  outputDir: string;
  /** Entrypoint path the manifest should advertise (relative to project root). */
  entrypoint: string;
  /** Build id; helps operators correlate deploys with manifests. */
  buildId: string;
  /** Optional user overrides from `nitro.options.creek`. */
  overrides?: CreekdPresetOptions;
}

/**
 * Build the manifest object. Separated from disk I/O so unit tests can
 * assert shape + validation without writing files.
 */
export function buildManifest(input: BuildManifestInput): CreekdDeployManifest {
  const opts = { ...DEFAULTS, ...input.overrides };
  const manifest: CreekdDeployManifest = {
    version: 1,
    target: "creekd",
    runtime: opts.runtime,
    entrypoint: input.entrypoint,
    port: opts.port,
    health_check_path: opts.healthCheckPath,
    buildId: input.buildId,
    framework: "nitro",
    adapter: {
      name: adapterPackage.name ?? "@solcreek/nitro",
      version: adapterPackage.version ?? "0.0.0",
    },
  };

  if (!isCreekdDeployManifest(manifest)) {
    throw new Error(
      "@solcreek/nitro: generated invalid creekd manifest (this is a bug — please report)",
    );
  }

  return manifest;
}

/** Build the manifest and write it to `<outputDir>/.creek-creekd/manifest.json`. */
export async function writeManifest(input: BuildManifestInput): Promise<string> {
  const manifest = buildManifest(input);
  const dir = path.join(input.outputDir, ".creek-creekd");
  const file = path.join(dir, "manifest.json");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(file, JSON.stringify(manifest, null, 2) + "\n");
  return file;
}
