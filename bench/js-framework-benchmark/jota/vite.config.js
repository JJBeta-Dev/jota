import { defineConfig } from "vite";
import jota from "vite-plugin-jota";

export default defineConfig({
  plugins: [jota()],
  build: {
    target: "es2022",
    modulePreload: false,
    rollupOptions: {
      input: "src/main.jsx",
      output: { entryFileNames: "main.js", format: "es" },
    },
  },
});
