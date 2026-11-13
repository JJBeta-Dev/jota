---
title: Rutas y páginas estáticas
description: Rutas por archivos y HTML generado en el build, sin JavaScript por defecto.
order: 3
---

# Rutas y páginas estáticas

Cada archivo de `src/routes` es una página. El build genera su HTML; la página no carga JavaScript salvo que lo pidas.

| Archivo | Dirección |
|---|---|
| `src/routes/index.tsx` | `/` |
| `src/routes/about.tsx` | `/about` |
| `src/routes/blog/[slug].tsx` | `/blog/lo-que-sea` |
| `src/routes/404.tsx` | Página de error |

## Una página

```tsx
export const head = { title: "Acerca de", description: "Quiénes somos.", lang: "es" };

export default function About() {
  return <h1>Acerca de</h1>;
}
```

## Rutas dinámicas y datos

```tsx
export const paths = () => posts.map((post) => ({ slug: post.slug }));

export const load = async ({ params }) => getPost(params.slug);

export default function Post(props) {
  return <h1>{props.data.title}</h1>;
}
```

`paths` dice qué páginas generar. `load` se ejecuta en el build y su resultado llega como `props.data`.

## Configuración

```ts
import jota from "vite-plugin-jota";
import jotaStatic from "vite-plugin-jota/static";

export default defineConfig({
  plugins: [jota(), jotaStatic({ site: "https://ejemplo.com", prefetch: true, viewTransitions: true })],
});
```

- `site`: escribe `sitemap.xml`.
- `prefetch`: el navegador descarga la página siguiente al pasar el cursor. Es un bloque de reglas, no un script que se ejecuta.
- `viewTransitions`: navegación animada entre páginas con una regla CSS.

## Páginas con JavaScript

```tsx
export const config = { render: "client" };
```

Esa página conserva su script y el navegador reutiliza el HTML que ya llegó (hidratación), así no se pierde el foco ni lo escrito.
