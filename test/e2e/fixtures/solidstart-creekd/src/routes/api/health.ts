import type { APIEvent } from "@solidjs/start/server";

export function GET(_event: APIEvent) {
  return {
    ok: true,
    framework: "solidstart",
    adapter: "@solcreek/nitro/creekd",
  };
}
