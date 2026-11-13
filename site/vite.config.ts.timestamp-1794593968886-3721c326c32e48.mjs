// vite.config.ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "file:///C:/Users/JJBeta/jota/node_modules/.pnpm/vite@5.4.21_@types+node@22.20.5/node_modules/vite/dist/node/index.js";
import jota from "file:///C:/Users/JJBeta/jota/packages/vite-plugin/dist/index.js";
import jotaStatic from "file:///C:/Users/JJBeta/jota/packages/vite-plugin/dist/static.js";
var __vite_injected_original_import_meta_url = "file:///C:/Users/JJBeta/jota/site/vite.config.ts";
var file = (path) => fileURLToPath(new URL(path, __vite_injected_original_import_meta_url));
var vite_config_default = defineConfig({
  plugins: [
    jota(),
    /** The docs site keeps itself honest: the build fails if a page grows past these limits. */
    jotaStatic({ budget: { maxJsPerRoute: "12kb", maxCssPerRoute: "20kb", maxHtmlPerRoute: "20kb", maxImageWeight: "200kb" } })
  ],
  resolve: {
    /** Babel (loaded only by the playground) expects Node's `path` and `assert`; the browser gets small stand-ins. */
    alias: [
      { find: /^(?:node:)?path$/, replacement: "path-browserify" },
      { find: /^(?:node:)?assert$/, replacement: file("src/playground/assert-shim.ts") }
    ]
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
        "runtime/web": file("src/playground/runtime-web.ts")
      },
      preserveEntrySignatures: "exports-only",
      output: {
        entryFileNames: (chunk) => chunk.name.startsWith("runtime/") ? "[name].js" : "assets/[name]-[hash].js"
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxKSkJldGFcXFxcam90YVxcXFxzaXRlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxKSkJldGFcXFxcam90YVxcXFxzaXRlXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9KSkJldGEvam90YS9zaXRlL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gXCJub2RlOnVybFwiO1xyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgam90YSBmcm9tIFwidml0ZS1wbHVnaW4tam90YVwiO1xyXG5pbXBvcnQgam90YVN0YXRpYyBmcm9tIFwidml0ZS1wbHVnaW4tam90YS9zdGF0aWNcIjtcclxuXHJcbmNvbnN0IGZpbGUgPSAocGF0aDogc3RyaW5nKSA9PiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwocGF0aCwgaW1wb3J0Lm1ldGEudXJsKSk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIGpvdGEoKSxcclxuICAgIC8qKiBUaGUgZG9jcyBzaXRlIGtlZXBzIGl0c2VsZiBob25lc3Q6IHRoZSBidWlsZCBmYWlscyBpZiBhIHBhZ2UgZ3Jvd3MgcGFzdCB0aGVzZSBsaW1pdHMuICovXHJcbiAgICBqb3RhU3RhdGljKHsgYnVkZ2V0OiB7IG1heEpzUGVyUm91dGU6IFwiMTJrYlwiLCBtYXhDc3NQZXJSb3V0ZTogXCIyMGtiXCIsIG1heEh0bWxQZXJSb3V0ZTogXCIyMGtiXCIsIG1heEltYWdlV2VpZ2h0OiBcIjIwMGtiXCIgfSB9KSxcclxuICBdLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIC8qKiBCYWJlbCAobG9hZGVkIG9ubHkgYnkgdGhlIHBsYXlncm91bmQpIGV4cGVjdHMgTm9kZSdzIGBwYXRoYCBhbmQgYGFzc2VydGA7IHRoZSBicm93c2VyIGdldHMgc21hbGwgc3RhbmQtaW5zLiAqL1xyXG4gICAgYWxpYXM6IFtcclxuICAgICAgeyBmaW5kOiAvXig/Om5vZGU6KT9wYXRoJC8sIHJlcGxhY2VtZW50OiBcInBhdGgtYnJvd3NlcmlmeVwiIH0sXHJcbiAgICAgIHsgZmluZDogL14oPzpub2RlOik/YXNzZXJ0JC8sIHJlcGxhY2VtZW50OiBmaWxlKFwic3JjL3BsYXlncm91bmQvYXNzZXJ0LXNoaW0udHNcIikgfSxcclxuICAgIF0sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICAvKipcclxuICAgICAgICogQmVzaWRlcyB0aGUgcGFnZSBlbnRyeSwgdGhlIHBsYXlncm91bmQgcHJldmlldyBuZWVkcyB0aGUgcnVudGltZSBhcyBzdGFuZGFsb25lIG1vZHVsZXMgd2l0aFxyXG4gICAgICAgKiBzdGFibGUgbmFtZXM6IGAvcnVudGltZS9qb3RhLmpzYCBhbmQgYC9ydW50aW1lL3dlYi5qc2AgKHNlZSBzcmMvcGxheWdyb3VuZC9jb21waWxlLnRzKS5cclxuICAgICAgICovXHJcbiAgICAgIGlucHV0OiB7XHJcbiAgICAgICAgbWFpbjogZmlsZShcImluZGV4Lmh0bWxcIiksXHJcbiAgICAgICAgXCJydW50aW1lL2pvdGFcIjogZmlsZShcInNyYy9wbGF5Z3JvdW5kL3J1bnRpbWUtam90YS50c1wiKSxcclxuICAgICAgICBcInJ1bnRpbWUvd2ViXCI6IGZpbGUoXCJzcmMvcGxheWdyb3VuZC9ydW50aW1lLXdlYi50c1wiKSxcclxuICAgICAgfSxcclxuICAgICAgcHJlc2VydmVFbnRyeVNpZ25hdHVyZXM6IFwiZXhwb3J0cy1vbmx5XCIsXHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiAoY2h1bmspID0+IChjaHVuay5uYW1lLnN0YXJ0c1dpdGgoXCJydW50aW1lL1wiKSA/IFwiW25hbWVdLmpzXCIgOiBcImFzc2V0cy9bbmFtZV0tW2hhc2hdLmpzXCIpLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF1USxTQUFTLHFCQUFxQjtBQUNyUyxTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFVBQVU7QUFDakIsT0FBTyxnQkFBZ0I7QUFINEksSUFBTSwyQ0FBMkM7QUFLcE4sSUFBTSxPQUFPLENBQUMsU0FBaUIsY0FBYyxJQUFJLElBQUksTUFBTSx3Q0FBZSxDQUFDO0FBRTNFLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLEtBQUs7QUFBQTtBQUFBLElBRUwsV0FBVyxFQUFFLFFBQVEsRUFBRSxlQUFlLFFBQVEsZ0JBQWdCLFFBQVEsaUJBQWlCLFFBQVEsZ0JBQWdCLFFBQVEsRUFBRSxDQUFDO0FBQUEsRUFDNUg7QUFBQSxFQUNBLFNBQVM7QUFBQTtBQUFBLElBRVAsT0FBTztBQUFBLE1BQ0wsRUFBRSxNQUFNLG9CQUFvQixhQUFhLGtCQUFrQjtBQUFBLE1BQzNELEVBQUUsTUFBTSxzQkFBc0IsYUFBYSxLQUFLLCtCQUErQixFQUFFO0FBQUEsSUFDbkY7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQUtiLE9BQU87QUFBQSxRQUNMLE1BQU0sS0FBSyxZQUFZO0FBQUEsUUFDdkIsZ0JBQWdCLEtBQUssZ0NBQWdDO0FBQUEsUUFDckQsZUFBZSxLQUFLLCtCQUErQjtBQUFBLE1BQ3JEO0FBQUEsTUFDQSx5QkFBeUI7QUFBQSxNQUN6QixRQUFRO0FBQUEsUUFDTixnQkFBZ0IsQ0FBQyxVQUFXLE1BQU0sS0FBSyxXQUFXLFVBQVUsSUFBSSxjQUFjO0FBQUEsTUFDaEY7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
