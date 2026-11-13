import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ESLint } from "eslint";
import tsParser from "@typescript-eslint/parser";
import plugin from "./index.js";
import { DEFAULT_LEVELS, PRESET_NAMES, presetRules, type Level, type PresetName } from "./presets.js";

export interface CliResult {
  /** Process exit code: 0 clean, 1 problems found, 2 usage or internal error. */
  code: number;
  /** Text to print to stdout. */
  output: string;
}

interface Options {
  paths: string[];
  preset: PresetName | undefined;
  rules: Record<string, Level>;
  config: string | undefined;
  format: "stylish" | "json";
  maxWarnings: number;
  ignore: string[];
  help: boolean;
  version: boolean;
}

const DEFAULT_IGNORES = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/coverage/**",
];

export const USAGE = `jota-guard — accessibility, semantics and performance checks for JSX/TSX

Usage:
  jota-guard [paths...] [options]

Options:
  --preset <name>        recommended (default) | strict | a11y-only
  --rule <id>=<level>    set one rule to error, warn or off (repeatable), e.g. --rule heading-order=error
  --config <file>        read settings from a JSON file (default: jota.config.json when present)
  --format <name>        stylish (default) | json
  --max-warnings <n>     fail when there are more than n warnings (default: never)
  --ignore <glob>        extra glob to ignore (repeatable)
  -h, --help             show this help
  -v, --version          show the version

Config file (jota.config.json):
  { "guard": { "preset": "recommended", "rules": { "heading-order": "error" },
               "ignore": ["**/generated/**"], "maxWarnings": 10 } }
Command line options override the config file.

Exit codes: 0 no failures, 1 problems found, 2 usage error.
`;

const LEVELS: readonly Level[] = ["error", "warn", "off"];

function normalizeRuleName(raw: string): string | null {
  const id = raw.startsWith("jota/") ? raw.slice("jota/".length) : raw;
  return id in DEFAULT_LEVELS ? `jota/${id}` : null;
}

function parseRuleSetting(value: string): { name: string; level: Level } | { error: string } {
  const [rawName = "", rawLevel = ""] = value.split("=");
  const name = normalizeRuleName(rawName.trim());
  if (!name) {
    return { error: `Unknown rule "${rawName}". Rules: ${Object.keys(DEFAULT_LEVELS).join(", ")}.` };
  }
  if (!(LEVELS as readonly string[]).includes(rawLevel.trim())) {
    return { error: `Rule "${rawName}" needs a level: ${LEVELS.join(", ")} (got "${rawLevel}").` };
  }
  return { name, level: rawLevel.trim() as Level };
}

interface FileConfig {
  preset?: PresetName;
  rules: Record<string, Level>;
  ignore: string[];
  maxWarnings?: number;
}

function readConfig(path: string): FileConfig | { error: string } {
  let json: unknown;
  try {
    json = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    return { error: `Cannot read config ${path}: ${error instanceof Error ? error.message : String(error)}` };
  }
  const guard = (json as { guard?: Record<string, unknown> } | null)?.guard ?? {};
  const config: FileConfig = { rules: {}, ignore: [] };

  if (guard.preset !== undefined) {
    if (typeof guard.preset !== "string" || !(PRESET_NAMES as readonly string[]).includes(guard.preset)) {
      return { error: `Config ${path}: unknown preset "${String(guard.preset)}". Use: ${PRESET_NAMES.join(", ")}.` };
    }
    config.preset = guard.preset as PresetName;
  }
  for (const [name, level] of Object.entries((guard.rules ?? {}) as Record<string, unknown>)) {
    const parsedRule = parseRuleSetting(`${name}=${String(level)}`);
    if ("error" in parsedRule) return { error: `Config ${path}: ${parsedRule.error}` };
    config.rules[parsedRule.name] = parsedRule.level;
  }
  if (guard.ignore !== undefined) {
    if (!Array.isArray(guard.ignore) || guard.ignore.some((item) => typeof item !== "string")) {
      return { error: `Config ${path}: "ignore" must be a list of globs.` };
    }
    config.ignore = guard.ignore as string[];
  }
  if (guard.maxWarnings !== undefined) {
    if (typeof guard.maxWarnings !== "number" || !Number.isInteger(guard.maxWarnings) || guard.maxWarnings < 0) {
      return { error: `Config ${path}: "maxWarnings" must be a non-negative integer.` };
    }
    config.maxWarnings = guard.maxWarnings;
  }
  return config;
}

function parseArgs(argv: string[]): Options | { error: string } {
  const options: Options = {
    paths: [],
    preset: undefined,
    rules: {},
    config: undefined,
    format: "stylish",
    maxWarnings: -1,
    ignore: [],
    help: false,
    version: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i] as string;
    const eq = raw.startsWith("--") ? raw.indexOf("=") : -1;
    const flag = eq === -1 ? raw : raw.slice(0, eq);
    const inline = eq === -1 ? undefined : raw.slice(eq + 1);
    const takeValue = (): string | undefined => {
      if (inline !== undefined) return inline;
      i += 1;
      return argv[i];
    };

    switch (flag) {
      case "-h":
      case "--help":
        options.help = true;
        break;
      case "-v":
      case "--version":
        options.version = true;
        break;
      case "--preset": {
        const value = takeValue();
        if (!value || !(PRESET_NAMES as readonly string[]).includes(value)) {
          return { error: `Unknown preset "${value ?? ""}". Use: ${PRESET_NAMES.join(", ")}.` };
        }
        options.preset = value as PresetName;
        break;
      }
      case "--rule": {
        const value = takeValue() ?? "";
        const parsedRule = parseRuleSetting(value);
        if ("error" in parsedRule) return parsedRule;
        options.rules[parsedRule.name] = parsedRule.level;
        break;
      }
      case "--config": {
        const value = takeValue();
        if (!value) return { error: "--config needs a file path." };
        options.config = value;
        break;
      }
      case "--format": {
        const value = takeValue();
        if (value !== "stylish" && value !== "json") {
          return { error: `Unknown format "${value ?? ""}". Use: stylish, json.` };
        }
        options.format = value;
        break;
      }
      case "--max-warnings": {
        const value = takeValue();
        const parsed = Number(value);
        if (value === undefined || value === "" || !Number.isInteger(parsed) || parsed < 0) {
          return { error: `--max-warnings needs a non-negative integer, got "${value ?? ""}".` };
        }
        options.maxWarnings = parsed;
        break;
      }
      case "--ignore": {
        const value = takeValue();
        if (!value) return { error: "--ignore needs a glob." };
        options.ignore.push(value);
        break;
      }
      default:
        if (raw.startsWith("-")) return { error: `Unknown option "${raw}".` };
        options.paths.push(raw);
    }
  }
  return options;
}

function readVersion(): string {
  const url = new URL("../package.json", import.meta.url);
  const pkg = JSON.parse(readFileSync(url, "utf8")) as { version?: string };
  return pkg.version ?? "unknown";
}

export async function run(argv: string[], cwd: string): Promise<CliResult> {
  const parsed = parseArgs(argv);
  if ("error" in parsed) {
    return { code: 2, output: `jota-guard: ${parsed.error}\n\n${USAGE}` };
  }
  if (parsed.help) return { code: 0, output: USAGE };
  if (parsed.version) return { code: 0, output: `${readVersion()}\n` };

  let preset: PresetName = parsed.preset ?? "recommended";
  let fileRules: Record<string, Level> = {};
  let ignore = [...parsed.ignore];
  let maxWarnings = parsed.maxWarnings;

  const configPath = parsed.config ? resolve(cwd, parsed.config) : resolve(cwd, "jota.config.json");
  if (parsed.config || existsSync(configPath)) {
    const config = readConfig(configPath);
    if ("error" in config) return { code: 2, output: `jota-guard: ${config.error}\n` };
    if (parsed.preset === undefined && config.preset) preset = config.preset;
    fileRules = config.rules;
    ignore = [...config.ignore, ...ignore];
    if (maxWarnings < 0 && config.maxWarnings !== undefined) maxWarnings = config.maxWarnings;
  }
  /** Priority: command line rules > config file rules > preset. */
  const rules = { ...presetRules(preset), ...fileRules, ...parsed.rules };

  try {
    const eslint = new ESLint({
      cwd,
      overrideConfigFile: true,
      errorOnUnmatchedPattern: false,
      overrideConfig: [
        { ignores: [...DEFAULT_IGNORES, ...ignore] },
        {
          files: ["**/*.{tsx,jsx}"],
          languageOptions: {
            parser: tsParser,
            parserOptions: { ecmaFeatures: { jsx: true } },
          },
          plugins: { jota: plugin },
          rules,
        },
      ],
    });

    const results = await eslint.lintFiles(parsed.paths.length > 0 ? parsed.paths : ["."]);
    const formatter = await eslint.loadFormatter(parsed.format);
    let output = await formatter.format(results);

    const errors = results.reduce((sum, r) => sum + r.errorCount + r.fatalErrorCount, 0);
    const warnings = results.reduce((sum, r) => sum + r.warningCount, 0);

    if (parsed.format === "stylish" && errors + warnings === 0) {
      output =
        results.length === 0
          ? "jota-guard: no .tsx or .jsx files found.\n"
          : `jota-guard: no problems found in ${results.length} file(s).\n`;
    }

    const tooManyWarnings = maxWarnings >= 0 && warnings > maxWarnings;
    return { code: errors > 0 || tooManyWarnings ? 1 : 0, output };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { code: 2, output: `jota-guard: ${message}\n` };
  }
}
