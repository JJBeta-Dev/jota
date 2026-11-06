# Changelog

All notable changes to Jota are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows [Semantic Versioning](https://semver.org/).

> 1.0.0 was released on 2026-11-06. / 1.0.0 se publicó el 2026-11-06.

## [Unreleased] / [Sin publicar]

### Added
- Jota Guard: sixteen new rules (26 in total). Errors: `iframe-title`, `aria-role-valid`, `aria-hidden-focusable`, `no-distracting-elements`, `valid-lang`, `heading-has-content`, `aria-props`, `scope-valid`, `aria-unsupported-elements`. Warnings: `no-autofocus`, `no-access-key`, `no-redundant-alt`, `mouse-events-have-key-events`, `no-redundant-roles`, `no-noninteractive-tabindex`, `anchor-ambiguous-text`. 305 Guard tests.

### Fixed
- Guard: `tabIndex={-1}` was not read as a number by the shared helper.

### Changed
- Reactivity core: effects and computeds keep their subscriptions between runs and only drop the sources they stopped reading; owners allocate children and cleanups lazily. Jota now beats Solid in 4 of 6 micro-benchmarks (see `bench/RESULTS.md`).
- README and README.es describe the published 1.0.0 instead of the pre-release state.

## [1.0.0] - 2026-11-06

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
- File-based router in `jota-js` (`createRoutes`, `matchRoute`, `buildPath`, `startRouter`) and static site generation in `vite-plugin-jota/static` (HTML-only pages, client routes, dynamic routes, head, inlined small CSS, image priority hints, 404, sitemap).
- Guard severity is configurable (`--rule`, `--config`, `jota.config.json`).
- `create-jota-js`: project scaffolder with TypeScript and JavaScript templates (10 tests).

- Documentation site (`site/`) built with Jota: English docs plus Spanish home and getting started, all static pages without JavaScript.
- Reactivity benchmarks against Solid and Preact Signals (`bench/`).
- Core performance: notify loops and the effect queue no longer allocate per update.
- Spanish README (`README.es.md`) for every package.

- Route `load` (async data) in the router and in the static build, with `notFound` and `onError` options for `startRouter`.
- Islands: `Island` and `startIslands`; static pages keep their script only when they contain an island.
- Static build: AVIF/WebP image conversion with `<picture>` (`images`, optional `sharp`) and critical CSS for large stylesheets (`criticalCss`).
- Examples: `blog`, `landing` and `dashboard`, each with tests and Guard.
- Lighthouse results for the docs site (100 in all four categories on four pages, local).

- Typed JSX for every standard HTML element and common SVG elements, with typed events and `data-*` / `aria-*` attributes.
- Rendering benchmark in a real browser against Solid (`bench/browser`).

- In-browser playground on the docs site: compiles TSX with the Jota compiler and runs it in a preview frame; covered by tests in a real browser.

- Performance budget for the static build (`budget`: JavaScript, CSS, HTML and image limits) that fails the build and names what went over.
- READMEs rewritten to match the actual state of the project.

### Fixed
- `startRouter` no longer duplicates pre-rendered HTML when the client takes over, and no longer hijacks clicks on links that are not client routes.
- List reconciliation moved almost every node when two rows were swapped; it now uses a longest-increasing-subsequence diff (swap in a 1,000-row list: 22 ms to 1.7 ms).
- SVG templates created a second wrapper element, so dynamic attributes of SVG children were applied to the wrapper.
- `Show` with a function child did not update when the value changed while it stayed truthy.
- `render` rebuilt the root component whenever the accessor it returned changed.
