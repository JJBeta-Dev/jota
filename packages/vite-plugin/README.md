[English](README.md) · [Español](README.es.md)

# vite-plugin-jota

Vite plugin that compiles Jota JSX and TypeScript (`.jsx`, `.tsx`) into direct DOM operations. No Virtual DOM.

> **Status: pre-alpha.** Works and is tested in the repository; the version on npm is still the `0.0.1` name placeholder.

```ts
// vite.config.ts
import { defineConfig } from "vite";
import jota from "vite-plugin-jota";

export default defineConfig({ plugins: [jota()] });
```

```json
// tsconfig.json
{ "compilerOptions": { "jsx": "preserve", "jsxImportSource": "jota-js" } }
```

Options:

| Option | Default | Meaning |
|---|---|---|
| `moduleName` | `"jota-js/web"` | Module that compiled code imports its DOM runtime from |

`transformJota(code, id)` is also exported for tooling and tests.

## Static generation (`vite-plugin-jota/static`)

```ts
import jota from "vite-plugin-jota";
import jotaStatic from "vite-plugin-jota/static";

export default defineConfig({
  plugins: [jota(), jotaStatic({ site: "https://example.com" })],
});
```

After `vite build`, every file in `src/routes` is rendered to HTML (`index.tsx` -> `/`, `blog/[slug].tsx` -> `/blog/:slug`). Pages are **static by default and ship no JavaScript**. A route can export:

| Export | Meaning |
|---|---|
| `default` | The page component, receives `{ params }` |
| `head` | `{ title, description, lang }` or a function of `params` |
| `config` | `{ render: "client" }` keeps the script so the page becomes interactive (the client hydrates the pre-rendered HTML) |
| `load` | Async data: `({ params }) => data`. Runs at build time; the result reaches the component as `props.data` and `head` as its second argument |
| `paths` | For dynamic routes: the parameter sets to pre-render. Without it the route is skipped with a warning |

Also done per page: the first `<img>` gets `fetchpriority="high"` and the others `loading="lazy"`, `404.html` is written from `routes/404.tsx`, and `sitemap.xml` is written when `site` is set.

### Options

| Option | Default | Meaning |
|---|---|---|
| `site` | none | Public origin; writes `sitemap.xml` |
| `routesDir` | `"src/routes"` | Folder with route files |
| `inlineCssLimit` | `20000` | Stylesheets up to this many bytes are inlined whole |
| `criticalCss` | `true` | Above the limit: inline only the CSS the page uses and load the rest without blocking (uses `beasties`; adds a small `onload` attribute and a `<noscript>` fallback) |
| `prefetch` | `false` | `true`, `"conservative"`, `"moderate"` or `"eager"`: the browser fetches the next page before the click (speculation rules, no JavaScript runs) |
| `viewTransitions` | `false` | Animated navigation between pages with one CSS rule |
| `budget` | none | `{ maxJsPerRoute, maxCssPerRoute, maxHtmlPerRoute, maxImageWeight }` as bytes or strings such as `"10kb"`. If a page or file goes over, the build fails and names it. JavaScript and CSS are measured gzipped, from the page's script tags, preloaded modules and stylesheet links |
| `images` | off | `true` or `{ formats, quality }`: convert local JPEG/PNG to AVIF and WebP with the optional `sharp` package and wrap `<img>` in `<picture>` |

### Islands

A static page can contain interactive islands: `<Island name="Newsletter" component={Newsletter} load="visible" />` is rendered to HTML at build time and mounted in the browser (`load`, `idle` or `visible`) by `startIslands(import.meta.glob("/src/islands/*.tsx"))` in your client entry. A static page with an island keeps its script tag; pages without islands still have none. The island is hydrated in the browser: the build numbers its templates and dynamic spots, and the client claims those elements instead of creating new ones.

Limits: `load` runs once per build; a client page that does not match its pre-rendered HTML is mounted from scratch.

Under the hood it runs `@babel/preset-typescript` and `babel-plugin-jsx-dom-expressions` (MIT) with event delegation off, so listeners attach directly to elements.

## Markdown (`vite-plugin-jota/markdown`)

```ts
import jota from "vite-plugin-jota";
import jotaStatic from "vite-plugin-jota/static";
import { jotaMarkdown } from "vite-plugin-jota/markdown";

export default defineConfig({ plugins: [jota(), jotaMarkdown(), jotaStatic()] });
```

```tsx
import Post, { frontmatter, headings, html } from "./post.md";
const posts = import.meta.glob("./posts/*.md", { eager: true });
```

- `frontmatter`: the data between `---` at the top of the file (strings, numbers, booleans and lists).
- `headings`: `{ depth, text, id }` for every heading; each one gets an `id` so it can be linked.
- `html`: the document as HTML. Use it with `<div innerHTML={html} />` or with the default component, `<Post class="prose" />`.
- **The build checks the content:** an image without alt text fails it; a heading that skips a level prints a warning. `jotaMarkdown({ guard: false })` turns this off.
- `highlight(code, language)` lets you plug a syntax highlighter that runs at build time.
- Types: add `/// <reference types="vite-plugin-jota/md" />` to a `.d.ts` file.
- HTML written inside Markdown is not sanitized: use it only for your own content.

## License

MIT © JJBeta
