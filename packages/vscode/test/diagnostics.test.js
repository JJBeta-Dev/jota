"use strict";

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const { test } = require("node:test");
const { parseGuardOutput, guardArguments } = require("../lib/diagnostics.js");

test("turns Guard JSON into zero-based problems", () => {
  const output = JSON.stringify([
    {
      filePath: "/a/Page.tsx",
      messages: [
        { ruleId: "jota/img-alt", severity: 2, message: "Add alt.", line: 3, column: 5, endLine: 3, endColumn: 20 },
        { ruleId: "jota/heading-order", severity: 1, message: "Skipped.", line: 7, column: 1 },
      ],
    },
  ]);
  const problems = parseGuardOutput(output);
  assert.equal(problems.length, 2);
  assert.deepEqual(
    { ...problems[0], url: Boolean(problems[0].url) },
    { line: 2, column: 4, endLine: 2, endColumn: 19, message: "Add alt.", rule: "jota/img-alt", severity: "error", url: true },
  );
  assert.equal(problems[1].severity, "warning");
  assert.equal(problems[1].endColumn, 1);
});

test("survives empty, clean and broken output", () => {
  assert.deepEqual(parseGuardOutput(""), []);
  assert.deepEqual(parseGuardOutput("[]"), []);
  assert.deepEqual(parseGuardOutput("[{"), []);
  assert.deepEqual(parseGuardOutput('[{"filePath":"a.tsx","messages":[]}]'), []);
});

test("builds the command line arguments", () => {
  assert.deepEqual(guardArguments("a.tsx"), ["a.tsx", "--format", "json"]);
  assert.deepEqual(guardArguments("a.tsx", { preset: "strict", fix: true }), ["a.tsx", "--format", "json", "--preset", "strict", "--fix"]);
});

test("reads the output of the real Guard command line", () => {
  const root = path.resolve(__dirname, "../../..");
  const bin = path.join(root, "packages/guard/dist/bin.js");
  const demo = path.join(root, "examples/guard-demo");
  let stdout = "";
  try {
    stdout = execFileSync(process.execPath, [bin, ...guardArguments(path.join(demo, "bad", "Page.tsx"))], { cwd: demo, encoding: "utf8" });
  } catch (error) {
    stdout = String(error.stdout);
  }
  const problems = parseGuardOutput(stdout);
  assert.ok(problems.some((problem) => problem.rule === "jota/img-alt" && problem.severity === "error"));
  assert.ok(problems.every((problem) => problem.line >= 0 && problem.column >= 0));
});
