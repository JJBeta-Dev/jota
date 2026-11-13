import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import jota from "vite-plugin-jota";
import jotaStatic from "vite-plugin-jota/static";
import { jotaMarkdown } from "vite-plugin-jota/markdown";

const core = (file: string) => fileURLToPath(new URL(`../../packages/core/src/${file}`, import.meta.url));

/** While testing, use the runtime sources so tests do not depend on a previous build. */
const testing = Boolean(process.env.VITEST);

export default defineConfig({
  plugins: [jota(), jotaMarkdown(), jotaStatic()],
  resolve: testing
    ? {
        alias: [
          { find: /^jota-js\/web$/, replacement: core("web.ts") },
          { find: /^jota-js$/, replacement: core("index.ts") },
        ],
      }
    : {},
  test: { environment: "happy-dom" },
});
