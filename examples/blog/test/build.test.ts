// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { build, createLogger } from "vite";
import { posts } from "../src/data/posts";

const root = fileURLToPath(new URL("..", import.meta.url));
let outDir: string;
const read = (...parts: string[]) => readFileSync(join(outDir, ...parts), "utf8");

beforeAll(async () => {
  outDir = await mkdtemp(join(tmpdir(), "jota-blog-"));
  await build({
    root,
    customLogger: createLogger("silent"),
    build: { outDir, emptyOutDir: true },
  });
}, 60_000);

afterAll(async () => {
  await rm(outDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
});

describe("blog build", () => {
  it("renders the home page with every post, newest first", () => {
    const html = read("index.html");
    const order = posts
      .map((post) => post.title)
      .sort((a, b) => html.indexOf(a) - html.indexOf(b));
    expect(html).toContain("<title>Blog | Jota</title>");
    for (const post of posts) expect(html).toContain(`href="/blog/${post.slug}"`);
    expect(html.indexOf("Guardrails in the build")).toBeLessThan(html.indexOf("Components run once"));
    expect(order).toHaveLength(posts.length);
  });

  it("renders one page per post with its own title and description", () => {
    for (const post of posts) {
      const html = read("blog", post.slug, "index.html");
      expect(html).toContain(`<h1>${post.title}</h1>`);
      expect(html).toContain(`<title>${post.title} | Jota blog</title>`);
      expect(html).toContain(`content="${post.summary}"`);
    }
  });

  it("renders about and 404 pages", () => {
    expect(read("about", "index.html")).toContain("<h1>About</h1>");
    expect(read("404.html")).toContain("Page not found");
  });

  it("ships no JavaScript on any page", () => {
    for (const file of ["index.html", "about/index.html", "404.html", ...posts.map((p) => `blog/${p.slug}/index.html`)]) {
      expect(existsSync(join(outDir, file)), file).toBe(true);
      expect(read(file), file).not.toContain("<script");
    }
  });
});
