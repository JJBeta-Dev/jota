/**
 * Rendering benchmark in a real browser (Microsoft Edge through puppeteer-core).
 * All apps build the same table with the same operations (js-framework-benchmark style).
 * Run: pnpm -r build && pnpm --filter jota-bench-browser bench
 */
import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import { build } from "vite";
import solid from "vite-plugin-solid";
import jota from "vite-plugin-jota";
import puppeteer from "puppeteer-core";

const here = resolve(fileURLToPath(new URL(".", import.meta.url)));
const BROWSERS = [
  process.env.CHROME_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const executablePath = BROWSERS.find((path) => existsSync(path));
if (!executablePath) {
  console.error("No Chromium-based browser found. Set CHROME_PATH.");
  process.exit(1);
}

const APPS = [
  { key: "jota", name: "Jota", plugin: () => jota() },
  { key: "solid", name: "Solid", plugin: () => solid() },
  { key: "preact", name: "Preact", esbuild: { jsx: "automatic", jsxImportSource: "preact" } },
  { key: "react", name: "React", esbuild: { jsx: "automatic", jsxImportSource: "react" } },
];

/** 1. Build the apps and measure their JavaScript. */
const sizes = {};
for (const app of APPS) {
  const root = join(here, "apps", app.key);
  const outDir = join(here, "dist", app.key);
  await build({
    root,
    configFile: false,
    logLevel: "silent",
    base: "./",
    plugins: app.plugin ? [app.plugin()] : [],
    ...(app.esbuild ? { esbuild: app.esbuild } : {}),
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    build: { outDir, emptyOutDir: true, target: "es2022" },
  });
  const assets = join(outDir, "assets");
  const js = readdirSync(assets).filter((file) => file.endsWith(".js"));
  const bytes = js.reduce((sum, file) => sum + readFileSync(join(assets, file)).length, 0);
  const gzip = js.reduce((sum, file) => sum + gzipSync(readFileSync(join(assets, file))).length, 0);
  sizes[app.key] = { bytes, gzip };
}

/** 2. Serve the builds. */
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const server = createServer((request, response) => {
  const [, key, ...rest] = (request.url ?? "/").split("?")[0].split("/");
  const path = rest.filter(Boolean);
  const file = join(here, "dist", key ?? "", ...(path.length ? path : ["index.html"]));
  if (!existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404).end("not found");
    return;
  }
  response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  response.end(readFileSync(file));
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;

/** 3. Operations. `before` puts the page in the state the operation needs; `run` is the timed part. */
const OPERATIONS = [
  { name: "create 1,000 rows", before: "bench.clear()", run: "bench.run(1000)" },
  { name: "replace 1,000 rows", before: "bench.clear(); bench.run(1000)", run: "bench.run(1000)" },
  { name: "update every 10th row (1,000 rows)", before: "bench.clear(); bench.run(1000)", run: "bench.updateEveryTenth()" },
  { name: "select a row (1,000 rows)", before: "bench.clear(); bench.run(1000)", run: "bench.select(500)" },
  { name: "swap two rows (1,000 rows)", before: "bench.clear(); bench.run(1000)", run: "bench.swap()" },
  { name: "remove a row (1,000 rows)", before: "bench.clear(); bench.run(1000)", run: "bench.remove(500)" },
  { name: "create 10,000 rows", before: "bench.clear()", run: "bench.run(10000)" },
  { name: "append 1,000 rows to 1,000", before: "bench.clear(); bench.run(1000)", run: "bench.add(1000)" },
  { name: "clear 1,000 rows", before: "bench.clear(); bench.run(1000)", run: "bench.clear()" },
];
const RUNS = 11;

const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-extensions"] });
const results = {};
try {
  for (const app of APPS) {
    results[app.key] = {};
    const page = await browser.newPage();
    await page.goto(`${origin}/${app.key}/`);
    await page.waitForFunction("typeof window.bench === 'object'");
    /** Warm up the JIT with the same operations. */
    await page.evaluate(`(async () => { for (let i = 0; i < 3; i++) { bench.clear(); bench.run(1000); bench.updateEveryTenth(); bench.swap(); bench.clear(); } })()`);

    for (const operation of OPERATIONS) {
      const times = await page.evaluate(
        `(async () => {
          const frame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          const times = [];
          for (let i = 0; i < ${RUNS}; i++) {
            ${operation.before};
            await frame();
            const start = performance.now();
            ${operation.run};
            document.body.getBoundingClientRect();
            times.push(performance.now() - start);
            await frame();
          }
          return times;
        })()`,
      );
      times.sort((a, b) => a - b);
      results[app.key][operation.name] = times[Math.floor(times.length / 2)];
    }
    await page.close();
  }
  var userAgent = await browser.version();
} finally {
  await browser.close();
  server.close();
}

const fmt = (value) => (value >= 100 ? value.toFixed(0) : value.toFixed(1));
console.log(`${userAgent} on ${os.cpus()[0]?.model.trim() ?? "unknown CPU"} (${os.platform()}), Node ${process.version}`);
console.log(`Median of ${RUNS} runs after a warm-up, milliseconds including forced layout, lower is better.\n`);
const bold = (value, best) => (value === best ? `**${fmt(value)}**` : fmt(value));
console.log(`| Operation | ${APPS.map((app) => app.name).join(" | ")} |`);
console.log(`|---|${APPS.map(() => "---:").join("|")}|`);
for (const operation of OPERATIONS) {
  const values = APPS.map((app) => results[app.key][operation.name]);
  const best = Math.min(...values);
  console.log(`| ${operation.name} | ${values.map((value) => bold(value, best)).join(" | ")} |`);
}
const kb = (bytes) => `${(bytes / 1000).toFixed(1)} kB`;
console.log(`
| JavaScript of the benchmark app | ${APPS.map((app) => app.name).join(" | ")} |`);
console.log(`|---|${APPS.map(() => "---:").join("|")}|`);
console.log(`| Minified | ${APPS.map((app) => kb(sizes[app.key].bytes)).join(" | ")} |`);
console.log(`| Gzip | ${APPS.map((app) => kb(sizes[app.key].gzip)).join(" | ")} |`);
