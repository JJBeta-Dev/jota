# Changelog

All notable changes to Jota are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows [Semantic Versioning](https://semver.org/).

> The version number stays at **1.0.0** and will not change until the first release is ready.
> Todos los cambios relevantes de Jota se documentan aquí. La versión se mantiene en **1.0.0** hasta que el primer lanzamiento esté listo.

## [1.0.0] - In development / En desarrollo

### Added
- Project skeleton: monorepo layout (`packages/guard`, `packages/core`, `packages/vite-plugin`, `packages/create-jota-js`, `docs`).
- `IA.md` with every technical decision and the context needed by any AI agent.
- `PLAN.md` with the full staged plan and decision gates.
- Bilingual README (`README.md` in English, `README.es.md` in Spanish).
- MIT license, `.gitignore`, root `package.json` (pnpm workspace) and `tsconfig.base.json`.
- Logo, isotype and variants as SVG (`assets/`).
- Guard rule specification draft (`docs/guard-rules.md`).
- npm names reserved with `0.0.1` placeholders: `jota-js`, `jota-guard`, `create-jota-js`, `vite-plugin-jota` (placeholders only; the project version stays 1.0.0 until the first real release).

- Jota Guard (`packages/guard`): ESLint plugin with 10 rules (`img-alt`, `img-size`, `clickable-role`, `button-name`, `link-name`, `input-label`, `heading-order`, `html-lang`, `no-positive-tabindex`, `media-captions`), three presets and the `jota-guard` CLI, covered by 130 tests.
- Demo project `examples/guard-demo` with planted violations.

- `jota-js` runtime: signals (`signal`, `computed`, `effect`, `batch`, `untrack`, `createRoot`, `onCleanup`), `Show`, `For`, `mergeProps`, `splitProps`, `render`, DOM runtime for compiled JSX and type-only `jsx-runtime`.
- `vite-plugin-jota`: compiles `.jsx` and `.tsx` to direct DOM updates, with end-to-end tests.
- GitHub Actions CI workflow (typecheck, build, test, Guard on the example).
- `examples/hello`: todo app built with Jota (4 tests, passes Guard, 6.18 kB JS / 2.65 kB gzip).
- Guard: `input-label` accepts the HTML-style `for` attribute.
- `create-jota-js`: project scaffolder with TypeScript and JavaScript templates (10 tests).

### Planned for 1.0.0
- Jota Guard: ESLint plugin + CLI for accessibility, semantics and performance-budget rules.
- Signals core and Vite plugin with compiled JSX.
- File-based routing (SSG and SPA), scoped CSS with critical CSS, islands, media plugin.
- `create-jota-js` with TypeScript (default) and JavaScript templates.
