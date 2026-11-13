#!/usr/bin/env node
/**
 * Release helper for the four published packages.
 *
 *   node scripts/release.mjs check             build, pack and verify the tarballs (no version change)
 *   node scripts/release.mjs prepare <version> set the version of the four packages, then run check
 *   node scripts/release.mjs publish           publish the tarballs in release/ (needs your npm login and PIN)
 *
 * `pack` goes through pnpm so `workspace:*` ranges are rewritten to real versions. Publishing opens a
 * browser confirmation for each package, so run it from a normal terminal.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PACKAGES = [
  { dir: "packages/core", name: "jota-js", files: ["dist/index.js", "dist/web.js", "dist/jsx-runtime.js", "README.md"] },
  { dir: "packages/vite-plugin", name: "vite-plugin-jota", files: ["dist/index.js", "dist/static.js", "README.md"] },
  { dir: "packages/guard", name: "jota-guard", files: ["dist/index.js", "dist/bin.js", "README.md"] },
  { dir: "packages/create-jota-js", name: "create-jota-js", files: ["dist/bin.js", "dist/cli.js", "README.md"] },
];

const run = (command, args, options = {}) =>
  spawnSync(command, args, { cwd: root, encoding: "utf8", shell: process.platform === "win32", ...options });

function fail(message) {
  console.error(`release: ${message}`);
  process.exit(1);
}

function step(title, command, args) {
  console.log(`\n> ${title}`);
  const result = run(command, args, { stdio: "inherit" });
  if (result.status !== 0) fail(`"${title}" failed.`);
}

function check(destination) {
  step("pnpm install --frozen-lockfile", "corepack", ["pnpm", "install", "--frozen-lockfile"]);
  step("pnpm -r build", "corepack", ["pnpm", "-r", "build"]);
  step("pnpm -r typecheck", "corepack", ["pnpm", "-r", "typecheck"]);
  step("pnpm -r test", "corepack", ["pnpm", "-r", "test"]);

  mkdirSync(destination, { recursive: true });
  for (const pkg of PACKAGES) {
    /** `pnpm pack` does not support --filter, so it runs inside each package folder. */
    const packed = run("corepack", ["pnpm", "pack", "--pack-destination", destination], { cwd: join(root, pkg.dir) });
    if (packed.status !== 0) fail(`pnpm pack failed for ${pkg.name}:\n${packed.stderr}`);
  }

  console.log("\n> Verifying tarballs");
  const tarballs = readdirSync(destination).filter((file) => file.endsWith(".tgz"));
  for (const pkg of PACKAGES) {
    const tarball = tarballs.find((file) => file.startsWith(`${pkg.name}-`));
    if (!tarball) fail(`no tarball found for ${pkg.name}.`);

    /** Relative names with cwd: GNU tar reads "C:\..." as a remote host. */
    const manifestText = run("tar", ["-xOf", tarball, "package/package.json"], { cwd: destination }).stdout;
    const manifest = JSON.parse(manifestText);
    if (/workspace:/.test(manifestText)) fail(`${tarball}: package.json still contains a workspace: range.`);
    if (manifest.name !== pkg.name) fail(`${tarball}: unexpected name ${manifest.name}.`);

    const listing = run("tar", ["-tf", tarball], { cwd: destination }).stdout.replaceAll("\\", "/");
    for (const file of pkg.files) {
      if (!listing.includes(`package/${file}`)) fail(`${tarball}: missing ${file}.`);
    }
    if (/package\/(test|src)\//.test(listing)) fail(`${tarball}: contains source or test files.`);
    console.log(`  ok  ${tarball}`);
  }
  console.log(`\nTarballs are in ${destination}`);
}

function setVersion(version) {
  if (!/^\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(version ?? "")) fail("give a version like 1.0.0.");
  for (const pkg of PACKAGES) {
    const file = join(root, pkg.dir, "package.json");
    const manifest = JSON.parse(readFileSync(file, "utf8"));
    manifest.version = version;
    writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`  ${pkg.name} -> ${version}`);
  }
}

const [command, argument] = process.argv.slice(2);

if (command === "check") {
  const temp = mkdtempSync(join(tmpdir(), "jota-release-"));
  try {
    check(temp);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
} else if (command === "prepare") {
  setVersion(argument);
  const destination = join(root, "release");
  rmSync(destination, { recursive: true, force: true });
  check(destination);
  console.log("\nNext: run `node scripts/release.mjs publish` from a normal terminal.");
} else if (command === "publish") {
  const destination = join(root, "release");
  if (!existsSync(destination)) fail("no release/ folder. Run `prepare <version>` first.");
  /** Publish in dependency order: the runtime first, the scaffolder last. */
  for (const pkg of PACKAGES) {
    const tarball = readdirSync(destination).find((file) => file.startsWith(`${pkg.name}-`) && file.endsWith(".tgz"));
    if (!tarball) fail(`no tarball for ${pkg.name} in release/.`);
    console.log(`\n> npm publish ${tarball}`);
    const result = spawnSync("npm", ["publish", join(destination, tarball), "--access", "public"], {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (result.status !== 0) fail(`publishing ${pkg.name} failed. Fix the problem and run publish again; already published packages will report that the version exists.`);
  }
  console.log("\nAll packages published.");
} else {
  console.log("Usage: node scripts/release.mjs <check | prepare <version> | publish>");
  process.exit(command ? 1 : 0);
}
