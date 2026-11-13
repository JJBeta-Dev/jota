/** @vitest-environment node */
import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { build, createLogger } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
let outDir: string;

beforeAll(async () => {
  outDir = await mkdtemp(join(tmpdir(), "jota-landing-"));
  await build({ root, customLogger: createLogger("silent"), build: { outDir, emptyOutDir: true } });
}, 60_000);

afterAll(async () => {
  await rm(outDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
});

describe("landing build", () => {
  it("renders the static content and the island's server HTML", () => {
    const html = readFileSync(join(outDir, "index.html"), "utf8");
    expect(html).toContain("<title>Jota landing | Pages that ship almost no JavaScript</title>");
    expect(html).toContain("Why it is light");
    expect(html).toContain('data-jota-island="Newsletter"');
    expect(html).toContain('data-jota-load="visible"');
    expect(html).toContain('<label for="newsletter-email">Email address</label>');
  });

  it("keeps the script on the page with the island and strips it from the 404", () => {
    expect(readFileSync(join(outDir, "index.html"), "utf8")).toContain('<script type="module"');
    expect(readFileSync(join(outDir, "404.html"), "utf8")).not.toContain("<script");
  });
});
