import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    tanstackStart(),
    nitro({
      config: {
        preset: "@solcreek/nitro/creekd",
        compatibilityDate: "2026-05-24",
      },
    }),
    viteReact(),
  ],
});
