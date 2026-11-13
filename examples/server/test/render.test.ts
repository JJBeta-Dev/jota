import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { build, createLogger } from "vite";
import jota from "vite-plugin-jota";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const core = (file: string) => fileURLToPath(new URL(`../../../packages/core/src/${file}`, import.meta.url));

let outDir: string;
let render: (data: { title: string; renderedAt: string; posts: string[] }) => Promise<string>;

beforeAll(async () => {
  await mkdir(join(root, "dist"), { recursive: true });
  outDir = await mkdtemp(join(root, "dist", "test-"));
  await build({
    root,
    configFile: false,
    customLogger: createLogger("silent"),
    plugins: [jota()],
    resolve: {
      alias: [
        { find: /^jota-js\/web$/, replacement: core("web.ts") },
        { find: /^jota-js\/server$/, replacement: core("server.ts") },
        { find: /^jota-js$/, replacement: core("index.ts") },
      ],
    },
    build: { ssr: "src/entry-server.tsx", outDir, emptyOutDir: true, target: "es2022", rollupOptions: { output: { entryFileNames: "entry-server.mjs" } } },
  });
  ({ render } = (await import(pathToFileURL(join(outDir, "entry-server.mjs")).href)) as { render: typeof render });
}, 60_000);

afterAll(async () => {
  await rm(outDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
});

const data = { title: "Hello", renderedAt: "now", posts: ["One", "Two"] };
const withoutMarks = (html: string): string => html.replace(/<!--.*?-->/g, "").replace(/ data-hk="[^"]*"/g, "");

describe("server rendering at request time", () => {
  it("renders the page with the data of each request", async () => {
    const first = withoutMarks(await render(data));
    const second = withoutMarks(await render({ ...data, title: "Other", posts: ["Three"] }));
    expect(first).toContain(">Hello</h1>");
    expect(first).toContain("<li");
    expect(first).toContain("One");
    expect(first).toContain("Two");
    expect(second).toContain(">Other</h1>");
    expect(second).toContain("Three");
    expect(second).not.toContain("Hello");
  });

  it("marks the HTML so the browser can hydrate it", async () => {
    const html = await render(data);
    expect(html).toMatch(/data-hk="\d+\.[a-z0-9]+"/);
    expect(html).toContain("<!--[0-->");
  });

  it("keeps concurrent requests apart", async () => {
    const pages = await Promise.all(Array.from({ length: 10 }, (_, i) => render({ ...data, title: `Page ${i}` })));
    pages.forEach((html, i) => expect(withoutMarks(html)).toContain(`>Page ${i}</h1>`));
  });
});
