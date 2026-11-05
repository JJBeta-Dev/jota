# create-jota-js

Scaffold a new Jota app in TypeScript (default) or JavaScript.

> **Status: pre-alpha.** The scaffolder works and is tested. The `jota-js`, `vite-plugin-jota` and `jota-guard` packages it installs have no real release yet (their npm versions are `0.0.1` name placeholders), so `npm install` in a generated project will only work after the first release (`^1.0.0`).

```bash
npm create jota-js@latest my-app             # TypeScript
npm create jota-js@latest my-app -- --template js
cd my-app
npm install
npm run dev
```

The generated project has a counter component, Vite with `vite-plugin-jota`, and an `npm run guard` script that runs Jota Guard. It refuses to write into a non-empty directory.

## License

MIT © JJBeta
