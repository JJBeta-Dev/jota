<div align="center">

<img src="assets/logo.svg" alt="Jota" width="320">

**Write plain JSX/TSX. Ship fast, accessible pages. Fail the build when they are not.**

[English](README.md) · [Español](README.es.md)

![status](https://img.shields.io/badge/status-pre--alpha-orange) ![license](https://img.shields.io/badge/license-MIT-blue) ![typescript](https://img.shields.io/badge/TypeScript-first-3178c6)

</div>

> **Status: 1.0.0, young.** The four packages are on npm and the code is tested (continuous integration runs on Node 20 and 22, on Linux and Windows), but Jota is new, has no outside users yet, and its API may still change. It has no hydration (islands re-mount instead). [PLAN.md](PLAN.md) holds the roadmap (in Spanish) and [IA.md](IA.md) every technical decision.

## What is Jota?

Jota is a frontend toolkit built on three ideas:

1. **Fine-grained reactivity, no Virtual DOM.** A component runs once; only the DOM node that reads a changed value is updated. There is no `useMemo`, no `useCallback` and no cascade of re-renders.
2. **Plain JSX and TypeScript.** Files are regular `.tsx` or `.jsx`. There is no custom file extension, so your editor, ESLint, Prettier and GitHub work without plugins.
3. **Accessibility checks that fail the build.** Jota Guard (an ESLint plugin and a command line tool) rejects a `<div onClick>` without a role or an `<img>` without `alt`, and tells you how to fix it. A performance budget can fail the build too.

Jota does not promise "100% on every metric". It gives you measurable limits and checks them for you.

## What is in this repository

| Package | What it does |
|---|---|
| [`jota-guard`](packages/guard) | Eighteen accessibility and semantics rules, as an ESLint plugin and the `jota-guard` command |
| [`jota-js`](packages/core) | Signals, `Show` and `For`, a file-based router, islands, and the DOM runtime for compiled JSX |
| [`vite-plugin-jota`](packages/vite-plugin) | Compiles `.tsx`/`.jsx`; static site generation with async data, AVIF/WebP images, critical CSS and a performance budget |
| [`create-jota-js`](packages/create-jota-js) | Creates a new app in TypeScript or JavaScript |

Also here: the documentation site with an in-browser playground ([`site/`](site)), four example apps ([`examples/`](examples)) and benchmarks ([`bench/`](bench)).

## Installation

```bash
npm create jota-js@latest my-app     # a new app, TypeScript by default
cd my-app
npm install
npm run dev

npx jota-guard src                   # or only audit an existing JSX/TSX project
```

Requirements: Node.js 20 or newer.

### Work on Jota itself (from this repository)

```bash
git clone https://github.com/JJBeta-Dev/jota.git
cd jota
corepack enable
pnpm install
pnpm -r build
pnpm --filter jota-site dev          # the docs site and the playground
pnpm --filter hello-jota dev         # the todo example
```

## A counter

The component function runs **once**; only the text node changes when `count` does.

```tsx
// src/Counter.tsx
import { signal } from "jota-js";

export function Counter() {
  const [count, setCount] = signal(0);

  return (
    <section>
      <h2>Counter</h2>
      <p>Clicks: {count()}</p>
      <button type="button" onClick={() => setCount(count() + 1)}>
        Add one
      </button>
    </section>
  );
}
```

The same component in JavaScript is identical without the types, in a `.jsx` file.

## Guardrails

```tsx
// This fails the check
<div onClick={openMenu}>Open</div>
<img src="/photo.jpg" />

// This passes
<button type="button" onClick={openMenu}>Open</button>
<img src="/photo.jpg" alt="Team working at the studio" width="800" height="600" />
```

`npx jota-guard src` prints:

```text
src/Header.tsx
  8:3  error  <div> with onClick is not keyboard accessible. Use <button type="button"> (or <a href>) instead  jota/clickable-role
  9:3  error  <img> needs an `alt` attribute. Describe the image, or use alt="" if it is purely decorative      jota/img-alt
```

The rules: clickable `div`/`span` without a role, `img` without `alt`, `img` without `width`/`height`, buttons and links without an accessible name, inputs without a label, heading order, `html` without `lang`, positive `tabIndex`, and `video` without captions. Two of them warn by default and can be made errors. See [packages/guard](packages/guard) and [docs/guard-rules.md](docs/guard-rules.md).

## Static pages and a performance budget

```ts
// vite.config.ts
import { defineConfig } from "vite";
import jota from "vite-plugin-jota";
import jotaStatic from "vite-plugin-jota/static";

export default defineConfig({
  plugins: [
    jota(),
    jotaStatic({
      site: "https://example.com",
      images: true, // AVIF and WebP, with <picture>
      budget: { maxJsPerRoute: "10kb", maxCssPerRoute: "20kb", maxImageWeight: "200kb" },
    }),
  ],
});
```

Every file in `src/routes` becomes an HTML page that contains no JavaScript unless the route asks for it. If a page goes over the budget, the build fails and says which page and by how much.

## What has been measured

- The todo example (`examples/hello`) compiles to 6.18 kB of JavaScript (2.65 kB gzip), runtime and CSS included.
- Nine of the ten pages of the docs site contain no JavaScript. Lighthouse (local, mobile emulation) gives 100 in performance, accessibility, best practices and SEO on four of them: [bench/lighthouse/RESULTS.md](bench/lighthouse/RESULTS.md). This is a small static site and a local measurement, not field data.
- In a real browser (Edge), the same table app in Jota and in Solid is within roughly 10% on most operations, and Jota's bundle is smaller (2.9 kB gzip against 4.6 kB): [bench/browser/RESULTS.md](bench/browser/RESULTS.md). One machine, one browser; it is not the official js-framework-benchmark.
- Reactivity micro-benchmarks against Solid and Preact Signals are in [bench/RESULTS.md](bench/RESULTS.md): Jota beats Solid in four of six scenarios and is still slower than Preact Signals. They measure the reactive graph in Node, not real pages.

## Known limits

- Islands and client routes are mounted again in the browser; there is no hydration of the server HTML.
- Pages are rendered once at build time. There is no server-side rendering on request.
- There are no scoped component styles or atomic CSS utilities.

## Project layout

```text
jota/
├─ packages/        guard, core (jota-js), vite-plugin, create-jota-js
├─ site/            documentation site and playground, built with Jota
├─ examples/        hello (todo), blog, landing, dashboard, guard-demo
├─ bench/           reactivity and browser benchmarks, Lighthouse results
├─ docs/            Guard rule specification
├─ scripts/         release helper (see RELEASING.md)
├─ IA.md            context and decisions for AI agents
├─ PLAN.md          staged plan (Spanish)
└─ CHANGELOG.md
```

## Contributing

Ideas, bug reports and rule suggestions are welcome through GitHub issues once the repository is public. Please read [IA.md](IA.md) first: it explains what is in and out of scope for version 1.

## License

[MIT](LICENSE) © JJBeta. JSX compilation uses `babel-plugin-jsx-dom-expressions` (MIT), the compiler family behind Solid, and critical CSS uses `beasties` (Apache-2.0).
