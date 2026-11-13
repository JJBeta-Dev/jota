/**
 * Builds the js-framework-benchmark entry (../js-framework-benchmark/jota) with the packages of this
 * repository and presses its buttons in a real browser, checking what the official runner expects.
 * Run: pnpm -r build && node bench/browser/check-jfb.mjs
 */
import { createServer } from "node:http";
import { existsSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import jota from "vite-plugin-jota";
import puppeteer from "puppeteer-core";

const here = resolve(fileURLToPath(new URL(".", import.meta.url)));
const entry = resolve(here, "../js-framework-benchmark/jota");
const executablePath = [
  process.env.CHROME_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((path) => path && existsSync(path));
if (!executablePath) {
  console.error("No Chromium-based browser found. Set CHROME_PATH.");
  process.exit(1);
}

const outDir = mkdtempSync(join(tmpdir(), "jota-jfb-"));
await build({
  root: here,
  configFile: false,
  logLevel: "silent",
  plugins: [jota()],
  build: {
    outDir,
    emptyOutDir: true,
    target: "es2022",
    modulePreload: false,
    rollupOptions: { input: join(entry, "src/main.jsx"), output: { entryFileNames: "main.js", format: "es" } },
  },
});

const server = createServer((request, response) => {
  if (request.url === "/dist/main.js") {
    response.writeHead(200, { "content-type": "text/javascript" }).end(readFileSync(join(outDir, "main.js")));
  } else if (request.url === "/") {
    response.writeHead(200, { "content-type": "text/html" }).end(readFileSync(join(entry, "index.html")));
  } else {
    response.writeHead(404).end();
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));

const failures = [];
const expect = (name, actual, expected) => {
  if (actual !== expected) failures.push(`${name}: expected ${expected}, got ${actual}`);
};
const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const rows = () => page.$$eval("tbody tr", (list) => list.length);
  const cell = (row, column) => page.$eval(`tbody tr:nth-child(${row}) td:nth-child(${column})`, (element) => element.textContent);

  await page.click("#run");
  expect("run creates 1,000 rows", await rows(), 1000);
  expect("first id", await cell(1, 1), "1");

  const firstRow = await page.$("tbody tr:nth-child(1)");
  await page.click("#update");
  expect("update marks every 10th row", (await cell(1, 2)).endsWith(" !!!"), true);
  expect("update leaves the others", (await cell(2, 2)).endsWith(" !!!"), false);
  expect("update keeps the same row element", await page.evaluate((row) => row === document.querySelector("tbody tr"), firstRow), true);

  await page.click("tbody tr:nth-child(5) td:nth-child(2) a");
  expect("select marks the row", await page.$eval("tbody tr:nth-child(5)", (row) => row.className), "danger");
  expect("select marks only one row", await page.$$eval("tbody tr.danger", (list) => list.length), 1);

  const second = await cell(2, 1);
  const last = await cell(999, 1);
  await page.click("#swaprows");
  expect("swap moves row 999 to 2", await cell(2, 1), last);
  expect("swap moves row 2 to 999", await cell(999, 1), second);

  await page.$eval("tbody tr:nth-child(1) td:nth-child(3) a", (link) => link.click());
  expect("remove deletes one row", await rows(), 999);
  expect("remove keeps the order", await cell(1, 1), last);

  await page.click("#add");
  expect("add appends 1,000 rows", await rows(), 1999);

  await page.click("#run");
  expect("run replaces the rows", await rows(), 1000);
  expect("replace creates new ids", await cell(1, 1), "2001");

  await page.click("#runlots");
  expect("runlots creates 10,000 rows", await rows(), 10000);

  await page.click("#clear");
  expect("clear removes every row", await rows(), 0);
} finally {
  await browser.close();
  server.close();
  rmSync(outDir, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`js-framework-benchmark entry: ${failures.length} check(s) failed\n${failures.join("\n")}`);
  process.exit(1);
}
console.log("js-framework-benchmark entry: all checks passed in a real browser");
