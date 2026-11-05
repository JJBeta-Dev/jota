// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { build, createLogger } from "vite";
import jota from "../src/index.js";
import jotaStatic from "../src/static.js";

const site = fileURLToPath(new URL("./site", import.meta.url));
const core = (file: string) => fileURLToPath(new URL(`../../core/src/${file}`, import.meta.url));

let outDir: string;
const warnings: string[] = [];
const read = (...parts: string[]) => readFileSync(join(outDir, ...parts), "utf8");

beforeAll(async () => {
  outDir = await mkdtemp(join(tmpdir(), "jota-static-"));
  const logger = createLogger("silent");
  logger.warn = (message) => void warnings.push(message);

  await build({
    root: site,
    configFile: false,
    customLogger: logger,
    plugins: [jota(), jotaStatic({ site: "https://example.test" })],
    resolve: {
      alias: [
        { find: /^jota-js\/web$/, replacement: core("web.ts") },
        { find: /^jota-js$/, replacement: core("index.ts") },
      ],
    },
    build: { outDir, emptyOutDir: true },
  });
}, 60_000);

afterAll(async () => {
  await rm(outDir, { recursive: true, force: true });
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

  it("renders dynamic routes for every path and fills the head from params", () => {
    expect(read("blog", "first-post", "index.html")).toContain("<h1>Post first-post</h1>");
    expect(read("blog", "second-post", "index.html")).toContain("<h1>Post second-post</h1>");
    expect(read("blog", "first-post", "index.html")).toContain("<title>Post: first-post</title>");
    expect(read("blog", "first-post", "index.html")).toContain('content="Reading first-post"');
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
