import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import jota from "./src/index.js";

const core = (file: string) => fileURLToPath(new URL(`../core/src/${file}`, import.meta.url));

export default defineConfig({
  plugins: [jota()],
  resolve: {
    alias: [
      { find: /^jota-js\/web$/, replacement: core("web.ts") },
      { find: /^jota-js$/, replacement: core("index.ts") },
    ],
  },
  test: { environment: "happy-dom" },
});
