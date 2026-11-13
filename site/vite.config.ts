import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import jota from "vite-plugin-jota";
import jotaStatic from "vite-plugin-jota/static";

const file = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [
    jota(),
    /** The docs site keeps itself honest: the build fails if a page grows past these limits. */
    jotaStatic({ prefetch: true, viewTransitions: true, budget: { maxJsPerRoute: "12kb", maxCssPerRoute: "20kb", maxHtmlPerRoute: "20kb", maxImageWeight: "200kb" } }),
  ],
  resolve: {
    /** Babel (loaded only by the playground) expects Node's `path` and `assert`; the browser gets small stand-ins. */
    alias: [
      { find: /^(?:node:)?path$/, replacement: "path-browserify" },
      { find: /^(?:node:)?assert$/, replacement: file("src/playground/assert-shim.ts") },
    ],
  },
  build: {
    rollupOptions: {
      /**
       * Besides the page entry, the playground preview needs the runtime as standalone modules with
       * stable names: `/runtime/jota.js` and `/runtime/web.js` (see src/playground/compile.ts).
       */
      input: {
        main: file("index.html"),
        "runtime/jota": file("src/playground/runtime-jota.ts"),
        "runtime/web": file("src/playground/runtime-web.ts"),
      },
      preserveEntrySignatures: "exports-only",
      output: {
        entryFileNames: (chunk) => (chunk.name.startsWith("runtime/") ? "[name].js" : "assets/[name]-[hash].js"),
      },
    },
  },
});
