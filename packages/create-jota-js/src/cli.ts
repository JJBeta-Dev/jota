import { mkdir, readdir, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { templateFiles, type TemplateName } from "./templates.js";

export interface CliResult {
  /** Process exit code: 0 created, 2 usage or filesystem error. */
  code: number;
  output: string;
}

export const USAGE = `create-jota-js — scaffold a new Jota app

Usage:
  npm create jota-js@latest [directory] [options]

Options:
  --template <ts|js>   TypeScript (default) or JavaScript
  -h, --help           show this help
`;

const VALID_NAME = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

function toPackageName(directory: string): string {
  return basename(directory)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/^[._]+/, "")
    .replace(/[^a-z0-9-~._]+/g, "-");
}

async function isEmptyOrMissing(directory: string): Promise<boolean> {
  try {
    const entries = await readdir(directory);
    return entries.length === 0;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return true;
    throw error;
  }
}

export interface ScaffoldOptions {
  directory: string;
  template: TemplateName;
}

/** Write a new project. Returns the relative paths of the created files. */
export async function scaffold({ directory, template }: ScaffoldOptions): Promise<string[]> {
  const name = toPackageName(directory);
  if (!VALID_NAME.test(name)) {
    throw new Error(`"${directory}" cannot be turned into a valid package name. Pick another directory name.`);
  }
  if (!(await isEmptyOrMissing(directory))) {
    throw new Error(`Directory "${directory}" is not empty. Choose a new or empty directory.`);
  }

  const files = templateFiles({ name, template });
  for (const [relative, contents] of files) {
    const target = join(directory, relative);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, contents, "utf8");
  }
  return files.map(([relative]) => relative);
}

export async function run(argv: string[], cwd: string): Promise<CliResult> {
  let template: TemplateName = "ts";
  let directory: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] as string;
    if (arg === "-h" || arg === "--help") return { code: 0, output: USAGE };
    if (arg === "--template" || arg.startsWith("--template=")) {
      const value = arg.includes("=") ? arg.slice(arg.indexOf("=") + 1) : argv[++i];
      if (value !== "ts" && value !== "js") {
        return { code: 2, output: `create-jota-js: unknown template "${value ?? ""}". Use ts or js.\n` };
      }
      template = value;
    } else if (arg.startsWith("-")) {
      return { code: 2, output: `create-jota-js: unknown option "${arg}".\n\n${USAGE}` };
    } else if (directory === undefined) {
      directory = arg;
    } else {
      return { code: 2, output: `create-jota-js: unexpected argument "${arg}".\n\n${USAGE}` };
    }
  }

  const target = resolve(cwd, directory ?? "jota-app");
  try {
    const files = await scaffold({ directory: target, template });
    const shown = directory ?? "jota-app";
    return {
      code: 0,
      output:
        `Created ${shown} (${template === "ts" ? "TypeScript" : "JavaScript"}, ${files.length} files).\n\n` +
        `Next steps:\n  cd ${shown}\n  npm install\n  npm run dev\n`,
    };
  } catch (error) {
    return { code: 2, output: `create-jota-js: ${error instanceof Error ? error.message : String(error)}\n` };
  }
}
