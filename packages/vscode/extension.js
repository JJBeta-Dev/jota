"use strict";

const { execFile } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");
const vscode = require("vscode");
const { parseGuardOutput, guardArguments } = require("./lib/diagnostics.js");

const LANGUAGES = new Set(["typescriptreact", "javascriptreact"]);
let warned = false;

/**
 * Find the Guard command line installed in the project that owns the file.
 * @param {string} file
 * @returns {{ bin: string, cwd: string } | undefined}
 */
function findGuard(file) {
  let folder = path.dirname(file);
  for (;;) {
    const bin = path.join(folder, "node_modules", "jota-guard", "dist", "bin.js");
    if (existsSync(bin)) return { bin, cwd: folder };
    const parent = path.dirname(folder);
    if (parent === folder) return undefined;
    folder = parent;
  }
}

/**
 * @param {import("vscode").TextDocument} document
 * @param {import("vscode").DiagnosticCollection} collection
 * @param {boolean} fix
 * @returns {Promise<void>}
 */
function check(document, collection, fix) {
  return new Promise((resolve) => {
    if (document.uri.scheme !== "file" || !LANGUAGES.has(document.languageId)) return resolve();
    const guard = findGuard(document.uri.fsPath);
    if (!guard) {
      collection.delete(document.uri);
      if (!warned) {
        warned = true;
        void vscode.window.showInformationMessage("Jota Guard is not installed in this project. Run: npm install -D jota-guard");
      }
      return resolve();
    }
    const preset = vscode.workspace.getConfiguration("jotaGuard").get("preset") || undefined;
    const args = [guard.bin, ...guardArguments(document.uri.fsPath, { preset, fix })];
    execFile(process.execPath, args, { cwd: guard.cwd, maxBuffer: 16 * 1024 * 1024, env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" } }, (_error, stdout) => {
      const diagnostics = parseGuardOutput(String(stdout)).map((problem) => {
        const range = new vscode.Range(problem.line, problem.column, problem.endLine, problem.endColumn);
        const severity = problem.severity === "error" ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning;
        const diagnostic = new vscode.Diagnostic(range, problem.message, severity);
        diagnostic.source = "jota-guard";
        diagnostic.code = problem.url ? { value: problem.rule, target: vscode.Uri.parse(problem.url) } : problem.rule;
        return diagnostic;
      });
      collection.set(document.uri, diagnostics);
      resolve();
    });
  });
}

/** @param {import("vscode").ExtensionContext} context */
function activate(context) {
  const collection = vscode.languages.createDiagnosticCollection("jota-guard");
  const enabled = () => vscode.workspace.getConfiguration("jotaGuard").get("enable") !== false;
  const auto = (/** @type {import("vscode").TextDocument} */ document) => {
    if (enabled()) void check(document, collection, false);
  };

  context.subscriptions.push(
    collection,
    vscode.workspace.onDidOpenTextDocument(auto),
    vscode.workspace.onDidSaveTextDocument(auto),
    vscode.workspace.onDidCloseTextDocument((document) => collection.delete(document.uri)),
    vscode.commands.registerCommand("jotaGuard.checkFile", () => {
      const document = vscode.window.activeTextEditor?.document;
      if (document) void check(document, collection, false);
    }),
    vscode.commands.registerCommand("jotaGuard.fixFile", async () => {
      const document = vscode.window.activeTextEditor?.document;
      if (!document) return;
      await document.save();
      await check(document, collection, true);
    }),
  );
  for (const document of vscode.workspace.textDocuments) auto(document);
}

function deactivate() {}

module.exports = { activate, deactivate };
