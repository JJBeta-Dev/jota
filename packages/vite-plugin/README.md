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
| `config` | `{ render: "client" }` keeps the script so the page becomes interactive (the client mounts again, it does not hydrate) |
| `paths` | For dynamic routes: the parameter sets to pre-render. Without it the route is skipped with a warning |

Also done per page: small stylesheets are inlined (up to 20 kB, option `inlineCssLimit`), the first `<img>` gets `fetchpriority="high"` and the others `loading="lazy"`, `404.html` is written from `routes/404.tsx`, and `sitemap.xml` is written when `site` is set.

Limits: pages render synchronously (no async data yet), and the inlined stylesheet is the whole file, not only above-the-fold CSS.

Under the hood it runs `@babel/preset-typescript` and `babel-plugin-jsx-dom-expressions` (MIT) with event delegation off, so listeners attach directly to elements.

## License

MIT © JJBeta
