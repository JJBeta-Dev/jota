<div align="center">

<img src="assets/logo.svg" alt="Jota" width="320">

**Write normal JSX/TSX. Ship fast, accessible, semantic pages. The build fails if you don't.**

[English](README.md) · [Español](README.es.md)

![status](https://img.shields.io/badge/status-pre--alpha-orange) ![license](https://img.shields.io/badge/license-MIT-blue) ![typescript](https://img.shields.io/badge/TypeScript-first-3178c6)

</div>

> **Status: pre-alpha, planning stage.** Nothing is published to npm yet. This README describes the target design so contributors and early users know where Jota is going. Sections marked 🚧 are not implemented yet. See [PLAN.md](PLAN.md) for the roadmap (in Spanish) and [IA.md](IA.md) for every technical decision.

## What is Jota?

Jota is a frontend toolkit built on three ideas:

1. **Fine-grained reactivity, no Virtual DOM.** Components run once; only the exact DOM node bound to a changed value updates. No `useMemo`, no `useCallback`, no cascading re-renders.
2. **Plain JSX and TypeScript.** Files are regular `.tsx` (TypeScript) or `.jsx` (JavaScript). There is no custom file extension, so your editor, ESLint, Prettier and GitHub work with no plugins.
3. **Guardrails at build time.** Accessibility, semantics and performance budgets are checked by the compiler. A `<div onClick>` without a role or an `<img>` without `alt` fails the build, with a message telling you how to fix it.

Jota does not promise "100% on every metric". It promises a **performance budget verified in CI** that you control.

## Roadmap at a glance

| Stage | What | Status |
|---|---|---|
| 1 | **Jota Guard**: ESLint plugin + CLI that audits any JSX/TSX project | ✅ built and tested, not yet released |
| 2 | Signals runtime + Vite plugin with compiled JSX | ✅ built and tested, not yet released |
| 3 | File routing, static generation, scaffolder, docs site | ✅ built and tested, not yet released (islands inside a page, real critical CSS and image conversion are not done) |
| 4 | Docs in English and Spanish, playground, examples | 🚧 docs site and todo example done (`site/`, `examples/hello`); playground and more examples pending |

## Installation 🚧

> These commands will work once the first packages are published. They are shown so the target experience is clear.

**Audit an existing project (Jota Guard, first release):**

```bash
npx jota-guard
```

**Create a new Jota app (TypeScript by default):**

```bash
npm create jota-js@latest my-app
cd my-app
npm install
npm run dev
```

Requirements: Node.js 20 or newer.

## Quick example 🚧

A counter in TypeScript. The component function runs **once**; only the text node updates when `count` changes.

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

The same component in JavaScript is identical without types, in a `.jsx` file.

## Guardrails example 🚧

```tsx
// ❌ This fails the build
<div onClick={openMenu}>Open</div>
<img src="/photo.jpg" />

// ✅ Fix suggested by Jota
<button type="button" onClick={openMenu}>Open</button>
<img src="/photo.jpg" alt="Team working at the studio" width="800" height="600" />
```

Example message:

```text
jota/img-alt  <img> needs an `alt` attribute.
Describe the image, or use alt="" if it is purely decorative.
More: https://github.com/JJBeta-Dev/jota/blob/main/docs/guard-rules.md#img-alt
```

First batch of rules: clickable `div`/`span` without role, `img` without `alt`, heading order, inputs without label, images without `width`/`height`, `html` without `lang`, buttons without accessible name.

## Performance budget 🚧

```ts
// jota.config.ts
import { defineConfig } from "jota-js/config";

export default defineConfig({
  budget: {
    maxJsPerRoute: "10kb",
    maxImageWeight: "200kb",
  },
});
```

If a route goes over budget, the build fails and tells you which asset caused it.

## What is measured today

- The todo example (`examples/hello`) compiles to 6.18 kB of JavaScript (2.65 kB gzip), runtime and CSS included.
- The docs site (`site/`) renders 8 pages with **no JavaScript**, around 6 kB of HTML each.
- Reactivity micro-benchmarks against Solid and Preact Signals are in [bench/RESULTS.md](bench/RESULTS.md): Jota is in Solid's range and slower than Preact Signals. They measure the reactive graph in Node, not real pages in a browser.

## Project layout

```text
jota/
├─ packages/
│  ├─ guard/             # ESLint plugin + CLI (Stage 1)
│  ├─ core/              # signals runtime (Stage 2)
│  ├─ vite-plugin/       # compiled JSX (Stage 2)
│  └─ create-jota-js/    # project scaffolder (Stage 3)
├─ docs/                 # documentation site (Stage 4)
├─ assets/               # logo and images
├─ IA.md                 # context and decisions for AI agents
├─ PLAN.md               # staged plan (Spanish)
└─ CHANGELOG.md
```

## Contributing

The project is in the planning stage. Ideas and rule suggestions are welcome through GitHub issues once the repository is public. Please read [IA.md](IA.md) first: it explains what is in and out of scope for v1.

## License

[MIT](LICENSE) © JJBeta. Jota reuses ideas and, in later stages, MIT-licensed code from the Solid ecosystem (`dom-expressions`), with attribution.
