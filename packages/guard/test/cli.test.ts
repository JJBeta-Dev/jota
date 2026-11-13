import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { run } from "../src/cli.js";

const demo = fileURLToPath(new URL("../../../examples/guard-demo", import.meta.url));

describe("jota-guard CLI", () => {
  it("fails with exit code 1 on the project with planted errors", async () => {
    const { code, output } = await run(["bad"], demo);
    expect(code).toBe(1);
    for (const id of [
      "jota/html-lang",
      "jota/clickable-role",
      "jota/img-alt",
      "jota/button-name",
      "jota/link-name",
      "jota/input-label",
      "jota/heading-order",
      "jota/no-positive-tabindex",
      "jota/media-captions",
    ]) {
      expect(output).toContain(id);
    }
  });

  it("passes with exit code 0 on the fixed copy", async () => {
    const { code, output } = await run(["good"], demo);
    expect(code).toBe(0);
    expect(output).toContain("no problems found");
  });

  it("treats warnings as non-failing by default", async () => {
    const { code, output } = await run(["warnings-only"], demo);
    expect(code).toBe(0);
    expect(output).toContain("jota/img-size");
  });

  it("fails on warnings with --preset strict", async () => {
    const { code } = await run(["warnings-only", "--preset", "strict"], demo);
    expect(code).toBe(1);
  });

  it("fails when warnings exceed --max-warnings", async () => {
    expect((await run(["warnings-only", "--max-warnings", "0"], demo)).code).toBe(1);
    expect((await run(["warnings-only", "--max-warnings=1"], demo)).code).toBe(0);
  });

  it("a11y-only preset turns img-size off", async () => {
    const { code, output } = await run(["warnings-only", "--preset", "a11y-only"], demo);
    expect(code).toBe(0);
    expect(output).not.toContain("jota/img-size");
  });

  it("supports --format json", async () => {
    const { output } = await run(["bad", "--format", "json"], demo);
    const parsed = JSON.parse(output) as Array<{ messages: Array<{ ruleId: string }> }>;
    expect(parsed[0]?.messages.some((m) => m.ruleId === "jota/img-alt")).toBe(true);
  });

  it("supports --format sarif", async () => {
    const { output } = await run(["bad", "--format", "sarif"], demo);
    const sarif = JSON.parse(output) as {
      version: string;
      runs: Array<{
        tool: { driver: { rules: Array<{ id: string; helpUri?: string }> } };
        results: Array<{ ruleId: string; level: string; locations: Array<{ physicalLocation: { artifactLocation: { uri: string } } }> }>;
      }>;
    };
    expect(sarif.version).toBe("2.1.0");
    const result = sarif.runs[0]?.results.find((r) => r.ruleId === "jota/img-alt");
    expect(result?.level).toBe("error");
    expect(result?.locations[0]?.physicalLocation.artifactLocation.uri).toBe("bad/Page.tsx");
    expect(sarif.runs[0]?.tool.driver.rules.find((r) => r.id === "jota/img-alt")?.helpUri).toContain("guard-rules.md");
  });

  it("supports --format github", async () => {
    const { output } = await run(["bad", "--format", "github"], demo);
    expect(output).toMatch(/^::error file=bad\/Page\.tsx,line=\d+,col=\d+,title=jota\/[a-z-]+::/m);
    expect((await run(["good", "--format", "github"], demo)).output).toBe("");
  });

  it("repairs safe problems with --fix and leaves the rest", async () => {
    const dir = await mkdtemp(join(tmpdir(), "jota-guard-fix-"));
    try {
      const file = join(dir, "Fix.tsx");
      await writeFile(
        file,
        ['export const A = () => (', "  <main>", '    <nav role="navigation">x</nav>', '    <input aria-label="q" autoFocus accessKey="s" />', '    <img src="a.png" width="1" height="1" />', "  </main>", ");", ""].join("\n")
      );
      const { code, output } = await run(["--fix", "--preset", "strict"], dir);
      const fixed = await readFile(file, "utf8");
      expect(fixed).toContain("<nav>x</nav>");
      expect(fixed).toContain('<input aria-label="q" />');
      expect(output).toContain("jota/img-alt");
      expect(output).not.toContain("jota/no-autofocus");
      expect(code).toBe(1);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("respects --ignore", async () => {
    const { code } = await run(["bad", "--ignore", "bad/**"], demo);
    expect(code).toBe(0);
  });

  it("prints help and version", async () => {
    expect((await run(["--help"], demo)).output).toContain("Usage:");
    expect((await run(["--version"], demo)).output).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("returns exit code 2 on usage errors", async () => {
    expect((await run(["--preset", "nope"], demo)).code).toBe(2);
    expect((await run(["--format", "xml"], demo)).code).toBe(2);
    expect((await run(["--max-warnings", "x"], demo)).code).toBe(2);
    expect((await run(["--wat"], demo)).code).toBe(2);
  });

  describe("configurable severity", () => {
    const withTempDir = async (body: (dir: string) => Promise<void>) => {
      const dir = await mkdtemp(join(tmpdir(), "guard-config-"));
      try {
        await body(dir);
      } finally {
        await rm(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
      }
    };
    const sample = 'export const a = <img src="/a.jpg" alt="x" />;';

    it("--rule turns a warning into an error and an error off", async () => {
      expect((await run(["warnings-only", "--rule", "img-size=error"], demo)).code).toBe(1);
      expect((await run(["warnings-only", "--rule", "jota/img-size=off"], demo)).output).not.toContain("img-size");
      const bad = await run(["bad", "--rule", "heading-order=error"], demo);
      expect(bad.output).toMatch(/error\s+Heading jumps/);
    });

    it("rejects unknown rules and levels with exit code 2", async () => {
      expect((await run(["--rule", "nope=error"], demo)).code).toBe(2);
      expect((await run(["--rule", "img-size=loud"], demo)).code).toBe(2);
      expect((await run(["--rule", "img-size"], demo)).code).toBe(2);
    });

    it("reads jota.config.json and lets the command line override it", () =>
      withTempDir(async (dir) => {
        await writeFile(join(dir, "a.tsx"), sample);
        await writeFile(join(dir, "jota.config.json"), JSON.stringify({ guard: { rules: { "img-size": "error" } } }));
        expect((await run(["."], dir)).code).toBe(1);
        expect((await run([".", "--rule", "img-size=warn"], dir)).code).toBe(0);
        expect((await run([".", "--preset", "a11y-only"], dir)).code).toBe(1); // file rule still applies
      }));

    it("config can set the preset, ignores and maxWarnings", () =>
      withTempDir(async (dir) => {
        await writeFile(join(dir, "a.tsx"), sample);
        await writeFile(join(dir, "jota.config.json"), JSON.stringify({ guard: { preset: "strict" } }));
        expect((await run(["."], dir)).code).toBe(1);
        await writeFile(join(dir, "jota.config.json"), JSON.stringify({ guard: { maxWarnings: 0 } }));
        expect((await run(["."], dir)).code).toBe(1);
        await writeFile(join(dir, "jota.config.json"), JSON.stringify({ guard: { ignore: ["a.tsx"] } }));
        expect((await run(["."], dir)).code).toBe(0);
      }));

    it("reports invalid config with exit code 2", () =>
      withTempDir(async (dir) => {
        await writeFile(join(dir, "jota.config.json"), "{ not json");
        expect((await run(["."], dir)).code).toBe(2);
        await writeFile(join(dir, "jota.config.json"), JSON.stringify({ guard: { rules: { "img-size": "loud" } } }));
        expect((await run(["."], dir)).code).toBe(2);
        await writeFile(join(dir, "jota.config.json"), JSON.stringify({ guard: { preset: "wild" } }));
        expect((await run(["."], dir)).code).toBe(2);
        expect((await run([".", "--config", "missing.json"], dir)).code).toBe(2);
      }));
  });
});
