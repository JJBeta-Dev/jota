#!/usr/bin/env node
import { run } from "./cli.js";

run(process.argv.slice(2), process.cwd())
  .then((result) => {
    process.stdout.write(result.output);
    process.exitCode = result.code;
  })
  .catch((error: unknown) => {
    process.stderr.write(`create-jota-js: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  });
