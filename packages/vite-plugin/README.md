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

Under the hood it runs `@babel/preset-typescript` and `babel-plugin-jsx-dom-expressions` (MIT) with event delegation off, so listeners attach directly to elements.

## License

MIT © JJBeta
