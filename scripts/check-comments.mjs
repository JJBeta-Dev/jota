#!/usr/bin/env node
/**
 * Repository rule: source files use JSDoc blocks only. Line comments (`//`), plain block comments
 * (`/* ... *\/`) and JSX comments (`{/* ... *\/}`) fail this check. Run: `node scripts/check-comments.mjs`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const roots = ["packages", "examples", "site", "bench", "scripts"];
const extensions = new Set([".ts", ".tsx", ".js", ".mjs", ".css"]);
const skip = new Set(["node_modules", "dist", "release", ".vite"]);
const pattern = /^\s*\/\/|^\s*\/\*(?!\*)|\{\/\*(?!\*)/;
const findings = [];

/** @param {string} dir */
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (extensions.has(extname(name))) check(path);
  }
}

/** @param {string} path */
function check(path) {
  const lines = readFileSync(path, "utf8").split("\n");
  lines.forEach((line, index) => {
    if (pattern.test(line) && !line.includes('code: "')) findings.push(`${path}:${index + 1}: ${line.trim()}`);
  });
}

for (const root of roots) walk(root);
if (findings.length > 0) {
  console.error(`Only JSDoc comments are allowed. ${findings.length} line(s) to fix:\n` + findings.join("\n"));
  process.exit(1);
}
console.log("Comments: OK (JSDoc only)");
