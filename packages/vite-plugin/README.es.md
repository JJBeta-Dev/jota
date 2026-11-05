[English](README.md) · [Español](README.es.md)

# vite-plugin-jota

Plugin de Vite que compila JSX y TypeScript de Jota (`.jsx`, `.tsx`) a operaciones directas sobre el DOM. Sin Virtual DOM.

> **Estado: pre-alpha.** Funciona y tiene pruebas en el repositorio; la versión en npm sigue siendo el marcador `0.0.1`.

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

## Generación estática (`vite-plugin-jota/static`)

```ts
import jota from "vite-plugin-jota";
import jotaStatic from "vite-plugin-jota/static";

export default defineConfig({
  plugins: [jota(), jotaStatic({ site: "https://example.com" })],
});
```

Después de `vite build`, cada archivo de `src/routes` se convierte en HTML. Las páginas son **estáticas por defecto y no cargan JavaScript**. Una ruta puede exportar:

| Export | Significado |
|---|---|
| `default` | El componente de la página; recibe `{ params }` |
| `head` | `{ title, description, lang }` o una función de `params` |
| `config` | `{ render: "client" }` conserva el script para que la página sea interactiva (el cliente vuelve a montarla, no hidrata) |
| `paths` | En rutas dinámicas: los parámetros a pre-renderizar. Sin él la ruta se omite con una advertencia |

Además, por página: las hojas de estilo pequeñas se incrustan (hasta 20 kB, opción `inlineCssLimit`), la primera `<img>` recibe `fetchpriority="high"` y las demás `loading="lazy"`, se escribe `404.html` desde `routes/404.tsx` y `sitemap.xml` cuando se define `site`.

Límites: las páginas se renderizan de forma síncrona (aún no hay datos asíncronos) y lo que se incrusta es la hoja completa, no solo el CSS visible sin hacer scroll.

## Licencia

MIT © JJBeta
