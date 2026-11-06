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
| `load` | Datos asíncronos: `({ params }) => datos`. Se ejecuta al compilar; el resultado llega al componente como `props.data` y a `head` como segundo argumento |
| `paths` | En rutas dinámicas: los parámetros a pre-renderizar. Sin él la ruta se omite con una advertencia |

Además, por página: la primera `<img>` recibe `fetchpriority="high"` y las demás `loading="lazy"`, se escribe `404.html` desde `routes/404.tsx` y `sitemap.xml` cuando se define `site`.

### Opciones

| Opción | Por defecto | Significado |
|---|---|---|
| `site` | ninguna | Origen público; escribe `sitemap.xml` |
| `routesDir` | `"src/routes"` | Carpeta con los archivos de rutas |
| `inlineCssLimit` | `20000` | Las hojas de estilo de hasta estos bytes se incrustan completas |
| `criticalCss` | `true` | Por encima del límite: incrusta solo el CSS que usa la página y carga el resto sin bloquear (usa `beasties`; añade un pequeño atributo `onload` y un respaldo `<noscript>`) |
| `budget` | ninguno | `{ maxJsPerRoute, maxCssPerRoute, maxHtmlPerRoute, maxImageWeight }` en bytes o como texto, por ejemplo `"10kb"`. Si una página o archivo lo supera, el build falla y lo nombra. El JavaScript y el CSS se miden comprimidos con gzip, a partir de las etiquetas script, los módulos precargados y los enlaces a hojas de estilo de la página |
| `images` | apagado | `true` o `{ formats, quality }`: convierte JPEG/PNG locales a AVIF y WebP con el paquete opcional `sharp` y envuelve `<img>` en `<picture>` |

### Islas

Una página estática puede contener islas interactivas: `<Island name="Newsletter" component={Newsletter} load="visible" />` se renderiza a HTML al compilar y el navegador la monta (`load`, `idle` o `visible`) con `startIslands(import.meta.glob("/src/islands/*.tsx"))` en tu entrada del cliente. Una página estática con una isla conserva su etiqueta de script; las páginas sin islas siguen sin ninguna. La isla se monta de nuevo en el navegador, no se hidrata.

Límites: `load` se ejecuta una vez por compilación; las rutas de cliente se montan de nuevo en vez de hidratarse.

## Licencia

MIT © JJBeta
