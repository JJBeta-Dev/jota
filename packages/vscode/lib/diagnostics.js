"use strict";

/**
 * @typedef {{ line: number, column: number, endLine: number, endColumn: number, message: string, rule: string, severity: "error" | "warning", url: string | undefined }} Problem
 */

const DOCS = "https://github.com/JJBeta-Dev/jota/blob/main/docs/guard-rules.md";

/**
 * Read the output of `jota-guard --format json` and return the problems of one file, with
 * zero-based positions (the editor counts from zero, ESLint from one).
 * @param {string} output
 * @returns {Problem[]}
 */
function parseGuardOutput(output) {
  const start = output.indexOf("[");
  if (start === -1) return [];
  /** @type {Array<{ messages?: Array<Record<string, unknown>> }>} */
  let results;
  try {
    results = JSON.parse(output.slice(start));
  } catch {
    return [];
  }
  if (!Array.isArray(results)) return [];
  return results.flatMap((result) =>
    (result.messages ?? []).map((message) => {
      const line = Math.max(0, Number(message.line ?? 1) - 1);
      const column = Math.max(0, Number(message.column ?? 1) - 1);
      const rule = typeof message.ruleId === "string" ? message.ruleId : "jota/parse-error";
      return {
        line,
        column,
        endLine: message.endLine ? Number(message.endLine) - 1 : line,
        endColumn: message.endColumn ? Number(message.endColumn) - 1 : column + 1,
        message: String(message.message ?? ""),
        rule,
        severity: message.severity === 2 ? "error" : "warning",
        url: rule.startsWith("jota/") && rule !== "jota/parse-error" ? DOCS : undefined,
      };
    }),
  );
}

/**
 * The arguments for the Guard command line.
 * @param {string} file
 * @param {{ preset?: string, fix?: boolean }} options
 * @returns {string[]}
 */
function guardArguments(file, options = {}) {
  const args = [file, "--format", "json"];
  if (options.preset) args.push("--preset", options.preset);
  if (options.fix) args.push("--fix");
  return args;
}

module.exports = { parseGuardOutput, guardArguments };
