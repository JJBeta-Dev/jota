<div align="center">

<img src="assets/logo.svg" alt="Jota" width="320">

**Write plain JSX/TSX. Ship fast, accessible pages. Fail the build when they are not.**

[English](README.md) · [Español](README.es.md)

![status](https://img.shields.io/badge/status-pre--alpha-orange) ![license](https://img.shields.io/badge/license-MIT-blue) ![typescript](https://img.shields.io/badge/TypeScript-first-3178c6)

</div>

> **Status: 1.0.0, young.** The four packages are on npm and the code is tested (continuous integration runs on Node 20 and 22, on Linux and Windows), but Jota is new, has no outside users yet, and its API may still change. Islands and client pages hydrate their server HTML; there is no server rendering at request time. [PLAN.md](PLAN.md) holds the roadmap (in Spanish) and [IA.md](IA.md) every technical decision.

## What is Jota?

Jota is a frontend toolkit built on three ideas:

1. **Fine-grained reactivity, no Virtual DOM.** A component runs once; only the DOM node that reads a changed value is updated. There is no `useMemo`, no `useCallback` and no cascade of re-renders.
2. **Plain JSX and TypeScript.** Files are regular `.tsx` or `.jsx`. There is no custom file extension, so your editor, ESLint, Prettier and GitHub work without plugins.
3. **Accessibility checks that fail the build.** Jota Guard (an ESLint plugin and a command line tool) rejects a `<div onClick>` without a role or an `<img>` without `alt`, and tells you how to fix it. A performance budget can fail the build too.

Jota does not promise "100% on every metric". It gives you measurable limits and checks them for you.

## What is in this repository

| Package | What it does |
|---|---|
| [`jota-guard`](packages/guard) | Twenty-six accessibility and semantics rules, as an ESLint plugin and the `jota-guard` command |
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
- Reactivity micro-benchmarks against Solid and Preact Signals are in [bench/RESULTS.md](bench/RESULTS.md): Jota is faster than Solid in five of six scenarios and within roughly 10-20% of Preact Signals in four of them (ahead of it in batching, about 4x behind it when creating many nodes). They measure the reactive graph in Node, not real pages.

## Known limits

- Islands and client pages are hydrated: the browser keeps the server elements (focus, typed text and scroll position inside them survive) and attaches listeners and effects. The build marks that HTML with `data-hk` attributes and comments, and the browser removes them. If the HTML does not match what the component builds, Jota mounts it from scratch instead. While attaching, the dynamic parts of a page are taken out of the DOM and put back once, so an iframe inside them reloads and a video or audio there stops. Not built: server rendering at request time, streaming, hydrating only some components of a page.
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

## How Jota compares

An honest map, not a scoreboard. The other columns describe each project in general terms (check their own documentation for details and versions); the Jota column describes what is in this repository today.

| | React | Angular | Vue | Svelte | Solid | Preact | **Jota** |
|---|---|---|---|---|---|---|---|
| How the page updates | Re-runs components, diffs a virtual DOM | Change detection, signals in recent versions | Fine-grained reactivity plus a virtual DOM | Compiled, signals-based (runes), no virtual DOM | Signals, no virtual DOM | Virtual DOM, small; signals as an add-on | Signals, no virtual DOM; components run once |
| Syntax | JSX / TSX | Templates + TypeScript classes | `.vue` single-file components | `.svelte` files | JSX / TSX | JSX / TSX | JSX / TSX, no custom extension |
| Accessibility checks | Community ESLint plugin | Optional template lint rules | Community ESLint plugin | **Built-in compiler warnings** | Community ESLint plugin | Community ESLint plugin | **Guard: 26 rules** as ESLint plugin and CLI, also for non-Jota JSX |
| Performance budget that fails the build | No | Bundle budgets in the CLI | No | No | No | No | **Yes**: JS, CSS, HTML and image limits per page |
| Routing and static pages | Needs a meta-framework (Next, Remix...) | Built-in router; SSR/prerender in the CLI | vue-router, Nuxt | SvelteKit | SolidStart | Add-ons | File-based router and static generation built in |
| Server rendering | Yes | Yes | Yes | Yes | Yes | Yes | **No** (static generation only) |
| Hydration | Yes | Yes | Yes | Yes | Yes | Yes | **Partial**: islands and client pages, whole at once; a mismatch re-mounts |
| JS on a plain content page | A runtime is shipped | A runtime is shipped | A runtime is shipped | Small runtime | A runtime is shipped | A runtime is shipped | **0 kB** unless the page has an island |
| Ecosystem, hiring, answers online | Huge | Large | Large | Medium | Small | Medium | **None yet** |
| Maturity | Years in production | Years in production | Years in production | Years in production | Years in production | Years in production | **1.0.0 released 2026-11-06, no outside users** |

### Where Jota is a good fit

- **Content-heavy sites with a few interactive parts** (docs, blogs, landing pages): static HTML by default, JavaScript only inside islands. The docs site of this repository ships 0 kB of JavaScript and scored 100 in all four Lighthouse categories on the pages measured ([results](bench/lighthouse/RESULTS.md)).
- **Teams that want accessibility and weight checked automatically**: Guard runs in the editor, in the terminal and in CI, and the budget fails the build before a heavy page ships.
- **People who already know JSX**: the syntax and the signal model are the ones of Solid, with TypeScript types for every element and event.
- **Trying Guard without switching framework**: `npx jota-guard src` audits any React, Preact or Solid project.

### Where something else is the better choice

- You need **server rendering at request time, streaming or partial hydration**: use Next, Nuxt, SvelteKit, SolidStart or Angular.
- You need **a large ecosystem** (component libraries, tutorials, hiring): React, Vue or Angular.
- You want the **fastest raw reactivity**: in our micro-benchmarks Preact Signals is still roughly 10-20% faster than Jota in most rows and about 4x faster at creating nodes ([numbers](bench/RESULTS.md)), and Solid is on par with Jota in the browser table benchmark ([numbers](bench/browser/RESULTS.md)).
- You want **compile-time accessibility warnings with zero setup** inside a framework with years of use: Svelte already has them.

## Contributing

Ideas, bug reports and rule suggestions are welcome through GitHub issues once the repository is public. Please read [IA.md](IA.md) first: it explains what is in and out of scope for version 1.

## License

[MIT](LICENSE) © JJBeta. JSX compilation uses `babel-plugin-jsx-dom-expressions` (MIT), the compiler family behind Solid, and critical CSS uses `beasties` (Apache-2.0).
