import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  server: {
    preset: "@solcreek/nitro/creekd",
    compatibilityDate: "2026-05-24",
  },
});
