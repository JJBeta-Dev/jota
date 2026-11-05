import { readFileSync } from "node:fs";
import { ESLint } from "eslint";
import tsParser from "@typescript-eslint/parser";
import plugin from "./index.js";
import { PRESET_NAMES, presetRules, type PresetName } from "./presets.js";

export interface CliResult {
  /** Process exit code: 0 clean, 1 problems found, 2 usage or internal error. */
  code: number;
  /** Text to print to stdout. */
  output: string;
}

interface Options {
  paths: string[];
  preset: PresetName;
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
  --format <name>        stylish (default) | json
  --max-warnings <n>     fail when there are more than n warnings (default: never)
  --ignore <glob>        extra glob to ignore (repeatable)
  -h, --help             show this help
  -v, --version          show the version

Exit codes: 0 no failures, 1 problems found, 2 usage error.
`;

function parseArgs(argv: string[]): Options | { error: string } {
  const options: Options = {
    paths: [],
    preset: "recommended",
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

  try {
    const eslint = new ESLint({
      cwd,
      overrideConfigFile: true,
      errorOnUnmatchedPattern: false,
      overrideConfig: [
        { ignores: [...DEFAULT_IGNORES, ...parsed.ignore] },
        {
          files: ["**/*.{tsx,jsx}"],
          languageOptions: {
            parser: tsParser,
            parserOptions: { ecmaFeatures: { jsx: true } },
          },
          plugins: { jota: plugin },
          rules: presetRules(parsed.preset),
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

    const tooManyWarnings = parsed.maxWarnings >= 0 && warnings > parsed.maxWarnings;
    return { code: errors > 0 || tooManyWarnings ? 1 : 0, output };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { code: 2, output: `jota-guard: ${message}\n` };
  }
}
