import { existsSync, readFileSync, statSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { build, createLogger } from "vite";
import puppeteer, { type Browser } from "puppeteer-core";
import { EXAMPLE } from "../src/playground/example";
import { compileSnippet, previewDocument } from "../src/playground/compile";

const root = fileURLToPath(new URL("..", import.meta.url));

describe("compileSnippet", () => {
  it("compiles TSX with the Jota compiler", async () => {
    const result = await compileSnippet(EXAMPLE);
    expect(result.error).toBeUndefined();
    expect(result.code).toContain("jota-js/web");
    expect(result.code).toContain("_$template(");
    expect(result.code).not.toContain("onClick=");
  });

  it("strips TypeScript types", async () => {
    const result = await compileSnippet("const n: number = 1; export default n;");
    expect(result.code).not.toContain(": number");
  });

  it("returns a readable error for invalid code", async () => {
    const result = await compileSnippet("const = ;");
    expect(result.code).toBeUndefined();
    expect(result.error).toBeTruthy();
    expect(result.error).not.toMatch(/^snippet\.tsx/);
  });
});

describe("previewDocument", () => {
  it("maps the runtime imports to this site and escapes closing script tags", () => {
    const html = previewDocument('const s = "</script><b>";', "https://example.test");
    expect(html).toContain('"jota-js":"https://example.test/runtime/jota.js"');
    expect(html).toContain('"jota-js/web":"https://example.test/runtime/web.js"');
    expect(html).toContain("<\\/script><b>");
    expect(html.match(/<\/script>/g)).toHaveLength(3);
  });
});

const BROWSERS = [
  process.env.CHROME_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter((path): path is string => Boolean(path));
const executablePath = BROWSERS.find((path) => existsSync(path));

describe.skipIf(!executablePath)("playground in a browser", () => {
  let outDir: string;
  let server: Server;
  let browser: Browser;
  let origin: string;

  beforeAll(async () => {
    outDir = await mkdtemp(join(tmpdir(), "jota-playground-"));
    await build({
      root,
      customLogger: createLogger("silent"),
      build: { outDir, emptyOutDir: true },
    });

    const TYPES: Record<string, string> = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" };
    server = createServer((request, response) => {
      const path = (request.url ?? "/").split("?")[0] ?? "/";
      let file = join(outDir, path);
      if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
      if (!existsSync(file) || !statSync(file).isFile()) {
        response.writeHead(404).end("not found");
        return;
      }
      response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
      response.end(readFileSync(file));
    });
    await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
    const address = server.address();
    origin = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;

    browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-extensions"] });
  });

  afterAll(async () => {
    await browser?.close();
    server?.close();
    await rm(outDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  });

  const open = async () => {
    const page = await browser.newPage();
    await page.goto(`${origin}/playground/`);
    await page.waitForSelector("#playground-code");
    return page;
  };

  const frameOf = async (page: Awaited<ReturnType<typeof open>>) => {
    const handle = await page.waitForSelector("iframe.playground-preview");
    const frame = await handle?.contentFrame();
    if (!frame) throw new Error("no preview frame");
    return frame;
  };

  it("runs the example and the running code is interactive", async () => {
    const page = await open();
    await page.click(".actions button");
    const frame = await frameOf(page);
    await frame.waitForFunction("document.querySelector('p')?.textContent === 'Count: 0'");
    await frame.click("button");
    await frame.click("button");
    await frame.waitForFunction("document.querySelector('p')?.textContent === 'Count: 2'");
    await page.close();
  });

  it("does not duplicate the pre-rendered page when the client takes over", async () => {
    const page = await open();
    expect(await page.$$eval("h1", (headings) => headings.length)).toBe(1);
    expect(await page.$$eval("#playground-code", (nodes) => nodes.length)).toBe(1);
    await page.close();
  });

  it("hydrates the pre-rendered page: the server elements stay in the page", async () => {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
      document.addEventListener("DOMContentLoaded", () => {
        Object.assign(window, { serverElements: Array.from(document.querySelectorAll("#app *")) });
      });
    });
    await page.goto(`${origin}/playground/`);
    await page.waitForSelector("#playground-code");
    await page.waitForFunction("document.querySelectorAll('[data-hk]').length === 0");
    const result = await page.evaluate(() => {
      const server = (window as unknown as { serverElements: Element[] }).serverElements;
      const app = document.getElementById("app") as HTMLElement;
      return {
        server: server.length,
        kept: server.filter((element) => app.contains(element)).length,
        comments: document.createTreeWalker(app, NodeFilter.SHOW_COMMENT).nextNode() === null,
      };
    });
    expect(result.server).toBeGreaterThan(10);
    expect(result.kept).toBe(result.server);
    expect(result.comments).toBe(true);
    await page.click(".actions button");
    const frame = await frameOf(page);
    await frame.waitForFunction("document.querySelector('p')?.textContent === 'Count: 0'");
    await page.close();
  });

  it("shows compile errors and runtime errors", async () => {
    const page = await open();
    const type = (value: string) =>
      page.$eval(
        "#playground-code",
        (element, text) => {
          const area = element as HTMLTextAreaElement;
          area.value = text;
          area.dispatchEvent(new Event("input", { bubbles: true }));
        },
        value,
      );

    await type("const = ;");
    await page.click(".actions button");
    await page.waitForFunction("document.querySelector('#playground-status')?.textContent?.startsWith('Compile error')");

    await type('throw new Error("boom");');
    await page.click(".actions button");
    await page.waitForFunction("document.querySelector('#playground-status')?.textContent?.includes('boom')");
    expect(await page.$eval("#playground-status", (element) => element.getAttribute("role"))).toBe("alert");
    await page.close();
  });

  it("keeps the other pages free of JavaScript, and links back to them as normal navigations", async () => {
    for (const path of ["/", "/docs/guard/", "/es/"]) {
      const html = readFileSync(join(outDir, path, "index.html"), "utf8");
      expect(html.replace(/<script type="speculationrules">[^<]*<\/script>/, ""), path).not.toContain("<script");
    }
    const page = await open();
    await page.click("a[href='/docs/guard']");
    await page.waitForFunction("location.pathname.startsWith('/docs/guard')");
    expect(await page.$$eval("script", (scripts) => scripts.length)).toBe(0);
    await page.close();
  });
});
