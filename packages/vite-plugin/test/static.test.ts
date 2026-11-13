/** @vitest-environment node */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import sharp from "sharp";
import { build, createLogger } from "vite";
import jota from "../src/index.js";
import jotaStatic, { parseSize } from "../src/static.js";

const site = fileURLToPath(new URL("./site", import.meta.url));
const core = (file: string) => fileURLToPath(new URL(`../../core/src/${file}`, import.meta.url));

let outDir: string;
let publicDir: string;
const warnings: string[] = [];
const read = (...parts: string[]) => readFileSync(join(outDir, ...parts), "utf8");

beforeAll(async () => {
  outDir = await mkdtemp(join(tmpdir(), "jota-static-"));
  sharp.cache(false);
  publicDir = await mkdtemp(join(tmpdir(), "jota-public-"));
  for (const name of ["hero", "second"]) {
    await sharp({ create: { width: 16, height: 8, channels: 3, background: "#6f3af8" } })
      .jpeg()
      .toFile(join(publicDir, `${name}.jpg`));
  }
  const logger = createLogger("silent");
  logger.warn = (message) => void warnings.push(message);

  await build({
    root: site,
    configFile: false,
    customLogger: logger,
    plugins: [jota(), jotaStatic({ site: "https://example.test", images: true })],
    resolve: {
      alias: [
        { find: /^jota-js\/web$/, replacement: core("web.ts") },
        { find: /^jota-js$/, replacement: core("index.ts") },
      ],
    },
    publicDir,
    build: { outDir, emptyOutDir: true },
  });
}, 60_000);

afterAll(async () => {
  await rm(publicDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  await rm(outDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
});

describe("static generation", () => {
  it("renders the home page into the shell with its head", () => {
    const html = read("index.html");
    expect(html).toContain("<h1>Welcome</h1>");
    expect(html).toContain("<title>Home | Test site</title>");
    expect(html).toContain('<meta name="description" content="The home page." />');
    expect(html).toContain('<html lang="en">');
    expect(html).not.toContain("Default title");
  });

  it("ships no JavaScript on static pages", () => {
    for (const file of ["index.html", "about/index.html", "blog/first-post/index.html", "404.html"]) {
      const html = read(file);
      expect(html, file).not.toContain("<script");
      expect(html, file).not.toContain("modulepreload");
    }
  });

  it("keeps the script on client routes and still pre-renders their content", () => {
    const html = read("app", "index.html");
    expect(html).toContain('<script type="module"');
    expect(html).toContain("<h1>Interactive</h1>");
    expect(html).toContain("Count: ");
    expect(html).toContain("<title>Interactive app</title>");
  });

  it("keeps the script only on a static page that contains an island", () => {
    const html = read("islands", "index.html");
    expect(html).toContain('data-jota-island="Counter"');
    expect(html).toContain('data-jota-load="load"');
    expect(html).toContain("&quot;start&quot;:5");
    expect(html.replace(/<!--.*?-->/g, "")).toContain("Count: 5");
    expect(html).toContain("Static text around the island.");
    expect(html).toContain('<script type="module"');
  });

  it("marks pages for hydration only where the browser needs it", () => {
    for (const file of ["index.html", "about/index.html", "404.html"]) {
      expect(read(file), file).not.toContain("data-hk");
      expect(read(file), file).not.toContain("<!--[");
    }
    /** A client page is numbered as a whole. */
    const client = read("app", "index.html");
    expect(client).toMatch(/data-hk="\d+\.[a-z0-9]+"/);
    expect(client).toContain("<!--[0-->");
    /** A static page with an island is marked inside the island and nowhere else. */
    const islands = read("islands", "index.html");
    expect(islands).toMatch(/data-hk="0\.[a-z0-9]+"/);
    expect(islands.indexOf("data-hk")).toBeGreaterThan(islands.indexOf("data-jota-island"));
    expect(islands.slice(0, islands.indexOf("data-jota-island"))).not.toContain("data-hk");
  });

  it("renders dynamic routes for every path and fills the head from params", () => {
    expect(read("blog", "first-post", "index.html")).toContain("<h1>Post first-post</h1>");
    expect(read("blog", "second-post", "index.html")).toContain("<h1>Post second-post</h1>");
    expect(read("blog", "first-post", "index.html")).toContain("<title>Post: first-post</title>");
    expect(read("blog", "first-post", "index.html")).toContain('content="Reading first-post"');
  });

  it("awaits async load() and passes the data to the page and to head", () => {
    const html = read("data", "index.html");
    expect(html).toContain("<li>alpha</li>");
    expect(html).toContain("<li>beta</li>");
    expect(html).toContain("<title>Data: 2 items</title>");
  });

  it("skips dynamic routes without paths and warns about it", () => {
    expect(existsSync(join(outDir, "users"))).toBe(false);
    expect(warnings.some((w) => w.includes("/users/:id") && w.includes("paths"))).toBe(true);
  });

  it("inlines the small stylesheet instead of linking it", () => {
    const html = read("about", "index.html");
    expect(html).toContain("<style>");
    expect(html).toContain("letter-spacing");
    expect(html).not.toContain('rel="stylesheet"');
  });

  it("marks the first image as high priority and the rest lazy", () => {
    const html = read("index.html");
    const images = html.match(/<img[^>]*>/g) ?? [];
    expect(images).toHaveLength(2);
    expect(images[0]).toContain('fetchpriority="high"');
    expect(images[0]).not.toContain("loading=");
    expect(images[1]).toContain('loading="lazy"');
    expect(images[1]).toContain('decoding="async"');
  });

  it("converts images to AVIF and WebP and serves them through <picture>", () => {
    for (const name of ["hero", "second"]) {
      expect(existsSync(join(outDir, `${name}.avif`)), `${name}.avif`).toBe(true);
      expect(existsSync(join(outDir, `${name}.webp`)), `${name}.webp`).toBe(true);
    }
    const html = read("index.html");
    expect(html.match(/<picture>/g)).toHaveLength(2);
    expect(html).toContain('<source type="image/avif" srcset="/hero.avif">');
    expect(html).toContain('<source type="image/webp" srcset="/hero.webp">');
    expect(html).toContain('src="/hero.jpg"');
    expect(html).toContain('alt="Hero"');
    expect(html.indexOf("image/avif")).toBeLessThan(html.indexOf("image/webp"));
  });

  it("writes 404.html and a sitemap without the 404 page", () => {
    expect(read("404.html")).toContain("Page not found");
    const sitemap = read("sitemap.xml");
    expect(sitemap).toContain("<loc>https://example.test/</loc>");
    expect(sitemap).toContain("<loc>https://example.test/about/</loc>");
    expect(sitemap).toContain("<loc>https://example.test/blog/first-post/</loc>");
    expect(sitemap).not.toContain("/404");
    expect(sitemap).not.toContain("/users");
  });

  it("still emits the client bundle for client routes", () => {
    const assets = readFileSync(join(outDir, "app", "index.html"), "utf8");
    const src = /src="([^"]+\.js)"/.exec(assets)?.[1];
    expect(src).toBeDefined();
    expect(existsSync(join(outDir, (src as string).replace(/^\//, "")))).toBe(true);
  });
});

describe("critical CSS for large stylesheets", () => {
  let largeOut: string;

  beforeAll(async () => {
    largeOut = await mkdtemp(join(tmpdir(), "jota-critical-"));
    const logger = createLogger("silent");
    await build({
      root: site,
      configFile: false,
      customLogger: logger,
      plugins: [jota(), jotaStatic({ inlineCssLimit: 10 })],
      resolve: {
        alias: [
          { find: /^jota-js\/web$/, replacement: core("web.ts") },
          { find: /^jota-js$/, replacement: core("index.ts") },
        ],
      },
      build: { outDir: largeOut, emptyOutDir: true },
    });
  }, 60_000);

  afterAll(async () => {
    await rm(largeOut, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  });

  it("inlines only the CSS the page uses and loads the full file without blocking", () => {
    const html = readFileSync(join(largeOut, "about", "index.html"), "utf8");
    const inline = /<style>([\s\S]*?)<\/style>/.exec(html)?.[1] ?? "";
    expect(inline).toContain("letter-spacing");
    expect(inline).not.toContain("never-used-anywhere");
    expect(html).toMatch(/<link rel="stylesheet"[^>]*href="\/assets\/[^"]+\.css"[^>]*media="print"/);
    expect(html).toContain("<noscript>");
    expect(html).not.toContain("data-beasties-container");
  });

  it("keeps the full stylesheet as a file, with the unused rule", () => {
    const asset = readdirSync(join(largeOut, "assets")).find((file) => file.endsWith(".css")) as string;
    expect(readFileSync(join(largeOut, "assets", asset), "utf8")).toContain("never-used-anywhere");
  });
});

describe("performance budget", () => {
  const buildWith = async (budget: Parameters<typeof jotaStatic>[0] extends infer O ? (O extends { budget?: infer B } ? B : never) : never) => {
    const dir = await mkdtemp(join(tmpdir(), "jota-budget-"));
    try {
      await build({
        root: site,
        configFile: false,
        customLogger: createLogger("silent"),
        plugins: [jota(), jotaStatic({ budget })],
        resolve: {
          alias: [
            { find: /^jota-js\/web$/, replacement: core("web.ts") },
            { find: /^jota-js$/, replacement: core("index.ts") },
          ],
        },
        build: { outDir: dir, emptyOutDir: true },
      });
    } finally {
      await rm(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    }
  };

  it("parses sizes", () => {
    expect(parseSize(2048)).toBe(2048);
    expect(parseSize("10kb")).toBe(10240);
    expect(parseSize("1.5 MB")).toBe(1572864);
    expect(parseSize("500b")).toBe(500);
    expect(() => parseSize("lots")).toThrow(/invalid size/);
  });

  it("passes with generous limits", async () => {
    await expect(buildWith({ maxJsPerRoute: "200kb", maxCssPerRoute: "50kb", maxHtmlPerRoute: "100kb", maxImageWeight: "1mb" })).resolves.toBeUndefined();
  }, 60_000);

  it("fails the build and names the page when JavaScript is over budget", async () => {
    await expect(buildWith({ maxJsPerRoute: "1b" })).rejects.toThrow(/performance budget exceeded[\s\S]*\/app: JavaScript is/);
  }, 60_000);

  it("fails on HTML that is too large", async () => {
    await expect(buildWith({ maxHtmlPerRoute: "10b" })).rejects.toThrow(/HTML is/);
  }, 60_000);
});
