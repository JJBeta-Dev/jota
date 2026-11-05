# IA.md — Context for any AI agent working on Jota

> Read this file first. It holds every technical decision taken so far and why, so you can continue the project without asking the owner for context that is already here. Keep it updated whenever a decision changes.
> Owner's working language is **Spanish**; the product (code, errors, docs) is **English-first** with Spanish docs as secondary.

## 1. What Jota is
**Jota** (npm: `jota-js`, CLI: `jota`) is an English-first, TypeScript-first frontend toolkit by **JJBeta** (Jerónimo Jiménez Betancur, UX/UI and front-end designer/developer).

Core idea: fine-grained reactivity (no Virtual DOM), JSX compiled to direct DOM operations, and **compile-time guardrails for accessibility, semantics and performance budgets that fail the build**.

The differentiator is the guardrails, not the runtime: Solid, Svelte, Qwik and Astro already cover the runtime space.

## 2. Hard constraints
- **Budget is $0.** No paid services, servers, domains or plans before Stage 6. Only free tiers: GitHub, GitHub Actions, npm, Cloudflare Pages / GitHub Pages, StackBlitz, Lighthouse CI.
- Solo maintainer, limited weekly time. Scope discipline matters more than features.
- No "100% guaranteed" claims. The promise is a **verified performance budget in CI** (Lighthouse 95+ on the demo site).
- Do not commit, push or publish to npm unless the owner asks.
- Owner does not speak fluent English: write English text clearly and simply, and flag it for native review before launch posts.

## 3. Technical decisions (and why)
| # | Decision | Why |
|---|---|---|
| D1 | Name **Jota**, package `jota-js`, CLI `jota`, repo `JJBeta-Dev/jota` (owner's real GitHub handle is `JJBeta-Dev`) | `jota` on npm is taken (abandoned 0.0.1-dev); GitHub users `jota`, `Jota-js` and `jjbeta` are taken by other people. Verified free on npm on 2026-11-03: `jota-js`, `jota-guard`, `create-jota-js`, `vite-plugin-jota`. Packages are **unscoped** because ownership of an npm scope like `@jota-js` cannot be verified from the registry. `JJBeta-Dev/jota` repo is free. |
| D2 | Risk: name sounds like **Jotai** (popular React state lib) | Brand always as "Jota by JJBeta" / "Jota.js". Rename gate before 1.0 if discoverability suffers after 3 months. |
| D3 | **No custom file extension.** Use `.tsx` (TypeScript) and `.jsx` (JavaScript), plus `.ts`/`.js` | A custom extension (`.jtsx`) loses syntax highlighting, the TS language server, ESLint, Prettier and GitHub rendering until editor plugins exist. Revisit only after 1.0. |
| D4 | **TypeScript-first** | All packages in strict TS; types ship with each package; `create-jota-js` templates offer TS (default) and JS. |
| D5 | **Explicit signals in v1**: `const [count, setCount] = signal(0)` | Implicit "every mutated `let` is a signal" needs custom TS semantics, confuses editors and Svelte replaced it with runes. Implicit sugar stays behind an experimental flag, only if users ask. |
| D6 | **Reuse `dom-expressions` / Babel preset** (MIT, Solid's engine) as the JSX compiler inside a Vite plugin | Writing a Rust compiler from scratch costs months. SWC/Rust is a later optimization. Keep MIT attribution notices. |
| D7 | **Jota Guard first**, as a standalone ESLint plugin + CLI (`npx jota-guard`) that audits any JSX project | Fast first win (3-5 weeks), early English-speaking feedback, no need to ask anyone to adopt a new runtime. Gate: 100+ stars or 500+ weekly downloads, or clear feedback. |
| D8 | v1 routing: file-based `routes/`, **SSG + client SPA only** | SSR, streaming and edge are deferred to v1.x. |
| D9 | v1 styles: scoped CSS per component, optional atomic utilities, critical CSS inlined at build | Good LCP without runtime CSS-in-JS. |
| D10 | v1 loading: **islands** (static HTML by default, JS only for interactive components) | Full resumability (Qwik style) is out of scope until there are users. |
| D11 | Media plugin: `sharp` for WebP/AVIF, automatic `width/height`, `fetchpriority="high"` on first image, `loading="lazy"` on the rest | Prevents CLS, helps LCP. |
| D12 | License **MIT** for core and Guard free tier | Maximum adoption. AGPL was rejected because it slows adoption. Paid parts live apart and closed. |
| D13 | Monorepo with **pnpm workspaces**, TypeScript, Vitest | Standard, free, fast. pnpm is not installed on the owner's machine yet (Node v24 is). Install with `npm i -g pnpm` or `corepack enable` when Stage 1 starts. |
| D14 | English-first, Spanish second | Larger community. Docs i18n via Astro Starlight from Stage 4. Guardrail error messages are written in English first and link to a docs page. |
| D16 | Visual identity follows the JJBeta kit (skill `jjbeta-design`). Isotype = proposal #8 "Thread j": a j sewn with a dotted thread, purple sphere (`#6F3AF8`, radial highlight) as its dot, soft `#F2ECFF` organic blob behind. Logo = lowercase `jota` where the j is that beaded thread and `ota` are heavy geometric strokes drawn as SVG paths (Poppins is not installed locally), ink `#1A0B3B`. Files in `assets/`: `logo.svg`, `logo-dark.svg`, `isotype.svg`, `isotype-dark.svg`, `isotype-mono.svg`, `favicon.svg`, `brand-sheet.png`, `isotype-proposals.png` | Owner picked #8. Known risk: the beaded j in the wordmark reads weaker than a solid j; a safer lockup (isotype + solid wordmark) can be made if legibility is a concern. |
| D17 | Guard rule IDs use the `jota/` prefix; auto-fix is wanted from v0.2 (safe cases only) | Owner decision 2026-11-03. Severity of `heading-order`/`img-size` stays `warn` until the owner confirms. |
| D15 | Version stays **1.0.0** and does not bump until the first release is ready | Owner's explicit instruction. `CHANGELOG.md` tracks 1.0.0 as in development. |

## 4. v1 scope
In: signals core (~2 KB), Vite plugin with compiled JSX, guardrails + performance budget (`jota.config`), file routing (SSG/SPA), scoped CSS + critical CSS, islands, media plugin, `create-jota-js`.
Out: SSR streaming, edge runtime, visual studio, hosting platform, React-to-Jota migrator, resumability, custom file extension.

Planned guardrail rules (first batch): `div`/`span` with click handler and no role; `img` without `alt`; heading order; inputs without label; images without `width/height`; `html` without `lang`; buttons without accessible name.

## 5. Monetization (only after traction, none required)
1. Brand and career value (primary).
2. GitHub Sponsors / Open Collective.
3. Jota Guard Pro: local CLI with PDF reports and license key, no servers.
4. Education and templates in JJBeta's design style.
5. React-to-Jota migrator only if adoption justifies it.
Payments, if ever: Lemon Squeezy / Gumroad (commission only).

## 6. Conventions
- Language: code, comments, commits, issues, errors, API names in **English**. Conversation with the owner in **Spanish**.
- TypeScript `strict: true`. No `any` without a comment.
- Guardrail error messages: short, actionable, with a docs link. Example: "`<img>` needs `alt`. Add a description or `alt=""` if decorative."
- Keep `PLAN.md` checkboxes and `CHANGELOG.md` up to date with every meaningful change.
- Supply chain: npm 2FA, provenance publishing from GitHub Actions, lockfile, Dependabot.
- Playwright only for screenshots/assets of the demo site or docs, when needed.

## 7. Current state (update this section)
- 2026-11-03: Stage 0 started. Skeleton created: `IA.md`, `PLAN.md`, `CHANGELOG.md`, `README.md`, `README.es.md`, `LICENSE`, `.gitignore`, root `package.json`, `tsconfig.base.json`, `assets/logo.svg`, empty `packages/{guard,core,vite-plugin,create-jota-js}` and `docs/`. `git init` done on `main`, **no commits yet**. Nothing installed, nothing published.
- 2026-11-03: names verified (see D1), logo approved (D16), Guard rule spec drafted in `docs/guard-rules.md`. Names reserved on npm 2026-11-03 (account `jjbeta`, 2FA via Windows Hello PIN): all four packages have `0.0.1` published and tagged `latest` (verified 2026-11-05; npm also created a `0.0.0-stage` version). Publishing needs browser confirmation, so run `npm publish` from a real terminal, not from the Claude `!` prompt.
- 2026-11-05: Stage 1 started. pnpm works through `corepack pnpm` (9.15.0, no global install). `packages/guard` has the ESLint plugin skeleton (ESM, TS strict, Vitest) with the first rule `jota/img-alt`: 10 tests pass, typecheck and build OK. Rule code reads JSX nodes through minimal local interfaces in `src/jsx.ts` (estree types have no JSX). Package version stays `0.0.1`: nothing new has been published.
- 2026-11-05 (later): all 10 Guard rules, presets (`recommended`, `strict`, `a11y-only`) and the CLI (`src/cli.ts`, bin `jota-guard`) are implemented with 130 passing Vitest tests; `examples/guard-demo/{bad,good,warnings-only}` back the CLI tests. Run from `packages/guard`: `corepack pnpm test`, `typecheck`, `build`. Git: local commits authored only by the owner (no AI co-author trailers, owner's explicit request). Not pushed, not published.
- 2026-11-05 (Stage 2): `packages/core` (jota-js) has signals (`src/reactive.ts`), control flow (`src/control.ts`), props helpers, the DOM runtime that compiled code calls (`src/web.ts`, exported as `jota-js/web`) and type-only `jsx-runtime`. `packages/vite-plugin` (vite-plugin-jota) compiles `.jsx`/`.tsx` with `@babel/preset-typescript` + `babel-plugin-jsx-dom-expressions` (options: `generate: "dom"`, `hydratable: false`, `delegateEvents: false`, `wrapConditionals: true`). End-to-end tests compile fixtures through the plugin in Vitest + happy-dom (19 core + 11 plugin tests). Reactivity design: staleness pushed through the graph, values pulled and compared by version before an effect re-runs (no glitches in diamonds, memos with unchanged values do not trigger effects).
- Known limits (Stage 2): JSX intrinsic elements are typed loosely; no hydration/SSR in the runtime; `insert` re-renders a whole array region when a nested function inside an array changes; event delegation exists in the runtime but the plugin turns it off; no benchmarks yet (Stage 2 gate still open); `vite@^5` is used as dev dependency (peer `>=5`).
- `examples/hello` is a todo app (workspace package `hello-jota`) that dogfoods runtime + plugin + Guard: 4 tests, `pnpm guard` passes, `vite build` output was 6.18 kB JS (2.65 kB gzip) on 2026-11-05. It is a client-rendered SPA: this number is NOT the SSG content-page budget of Stage 3.
- Test environment note: happy-dom 15.x had a bug where `form.nextSibling` was null in cloned templates (broke compiled traversals); tests use happy-dom ^20.
- Guard `input-label` also accepts the HTML-style `for` attribute on `<label>` (131 guard tests).
- CI: `.github/workflows/ci.yml` runs typecheck, build and tests on Node 20/22 for Ubuntu and Windows (never executed yet because the repo is not on GitHub).
- Next: owner decisions pending (severity of `heading-order`/`img-size`); create the GitHub repo `JJBeta-Dev/jota` and push when the owner says so; publish the real `jota-guard` only from a real terminal (needs WebAuthn). Then Stage 2 (signals core + Vite plugin). Possible Guard follow-ups: GitHub Actions CI, v0.2 auto-fix for safe cases, `--fix`.

## 8. How to continue
1. Read `PLAN.md` and pick the first unchecked item of the current stage.
2. Respect the stage gates; do not start Stage 2 before the Stage 1 gate is evaluated.
3. Update section 7 and `CHANGELOG.md` when you finish.
