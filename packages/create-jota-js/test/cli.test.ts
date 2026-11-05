import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { run } from "../src/cli.js";
import { JOTA_VERSION_RANGE } from "../src/templates.js";

let cwd: string;

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), "create-jota-"));
});

afterEach(async () => {
  await rm(cwd, { recursive: true, force: true });
});

const read = (...parts: string[]) => readFile(join(cwd, ...parts), "utf8");

describe("create-jota-js", () => {
  it("creates a TypeScript project by default", async () => {
    const { code, output } = await run(["my-app"], cwd);
    expect(code).toBe(0);
    expect(output).toContain("Created my-app");

    for (const file of [
      "package.json", "tsconfig.json", "vite.config.ts", "index.html", "src/main.tsx", "src/App.tsx",
      "src/style.css", ".gitignore", "README.md",
    ]) {
      expect(existsSync(join(cwd, "my-app", file)), file).toBe(true);
    }

    const pkg = JSON.parse(await read("my-app", "package.json")) as {
      name: string;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
      scripts: Record<string, string>;
    };
    expect(pkg.name).toBe("my-app");
    expect(pkg.dependencies["jota-js"]).toBe(JOTA_VERSION_RANGE);
    expect(pkg.devDependencies["vite-plugin-jota"]).toBe(JOTA_VERSION_RANGE);
    expect(pkg.devDependencies["jota-guard"]).toBe(JOTA_VERSION_RANGE);
    expect(pkg.devDependencies.typescript).toBeDefined();
    expect(pkg.scripts.guard).toBe("jota-guard src");
    expect(await read("my-app", "tsconfig.json")).toContain('"jsxImportSource": "jota-js"');
    expect(await read("my-app", "src", "App.tsx")).toContain("JSXElement");
  });

  it("creates a JavaScript project with --template js", async () => {
    const { code } = await run(["plain", "--template", "js"], cwd);
    expect(code).toBe(0);
    expect(existsSync(join(cwd, "plain", "src", "App.jsx"))).toBe(true);
    expect(existsSync(join(cwd, "plain", "vite.config.js"))).toBe(true);
    expect(existsSync(join(cwd, "plain", "tsconfig.json"))).toBe(false);
    const pkg = JSON.parse(await read("plain", "package.json")) as { devDependencies: Record<string, string> };
    expect(pkg.devDependencies.typescript).toBeUndefined();
    expect(await read("plain", "index.html")).toContain("/src/main.jsx");
  });

  it("supports --template=js and uses jota-app as the default directory", async () => {
    const { code } = await run(["--template=js"], cwd);
    expect(code).toBe(0);
    expect(existsSync(join(cwd, "jota-app", "src", "App.jsx"))).toBe(true);
  });

  it("generated pages are accessible by Guard's own rules (lang, title, viewport, button type)", async () => {
    await run(["site"], cwd);
    const html = await read("site", "index.html");
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("<title>site</title>");
    expect(html).toContain('name="viewport"');
    expect(await read("site", "src", "App.tsx")).toContain('<button type="button"');
  });

  it("normalizes the package name from the directory", async () => {
    await run(["My Cool App"], cwd);
    const pkg = JSON.parse(await read("My Cool App", "package.json")) as { name: string };
    expect(pkg.name).toBe("my-cool-app");
  });

  it("refuses a non-empty directory and does not touch it", async () => {
    await mkdir(join(cwd, "busy"));
    await writeFile(join(cwd, "busy", "keep.txt"), "mine");
    const { code, output } = await run(["busy"], cwd);
    expect(code).toBe(2);
    expect(output).toContain("not empty");
    expect(await read("busy", "keep.txt")).toBe("mine");
    expect(existsSync(join(cwd, "busy", "package.json"))).toBe(false);
  });

  it("accepts an existing empty directory", async () => {
    await mkdir(join(cwd, "empty"));
    expect((await run(["empty"], cwd)).code).toBe(0);
  });

  it("rejects names that cannot become a package name", async () => {
    const { code, output } = await run(["___"], cwd);
    expect(code).toBe(2);
    expect(output).toContain("valid package name");
  });

  it("rejects bad usage with exit code 2", async () => {
    expect((await run(["a", "--template", "go"], cwd)).code).toBe(2);
    expect((await run(["--wat"], cwd)).code).toBe(2);
    expect((await run(["a", "b"], cwd)).code).toBe(2);
  });

  it("prints help", async () => {
    const { code, output } = await run(["--help"], cwd);
    expect(code).toBe(0);
    expect(output).toContain("Usage:");
  });
});
