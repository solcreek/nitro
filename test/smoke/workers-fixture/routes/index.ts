import { defineHandler } from "nitro";

export default defineHandler(() => ({ ok: true, from: "workers-fixture" }));
