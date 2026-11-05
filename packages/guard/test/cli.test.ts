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
});
