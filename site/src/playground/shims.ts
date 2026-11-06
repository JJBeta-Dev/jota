// Babel was written for Node and reads a few `process` values. In the browser we give it the minimum:
// a working directory, an environment object and a platform name.
const scope = globalThis as unknown as { process?: Record<string, unknown> };

scope.process ??= {
  cwd: () => "/",
  env: { NODE_ENV: "production" },
  platform: "linux",
  versions: {},
  version: "",
  browser: true,
};

export {};
