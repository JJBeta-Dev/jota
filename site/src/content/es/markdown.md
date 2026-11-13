---
title: Contenido en Markdown
description: Escribe páginas y artículos en Markdown. El build revisa sus imágenes y encabezados.
order: 6
---

# Contenido en Markdown

Escribe el contenido en archivos `.md` e impórtalos como cualquier módulo. La página sigue siendo HTML: no se añade JavaScript. Esta página es un archivo Markdown.

## Configuración

```ts
import jota from "vite-plugin-jota";
import jotaStatic from "vite-plugin-jota/static";
import { jotaMarkdown } from "vite-plugin-jota/markdown";

export default defineConfig({ plugins: [jota(), jotaMarkdown(), jotaStatic()] });
```

Para los tipos, añade esta línea en un archivo `.d.ts` dentro de `src`:

```ts
/// <reference types="vite-plugin-jota/md" />
```

## Importar un archivo

```tsx
import Post, { frontmatter, headings, html } from "./post.md";

<article innerHTML={html} />;
```

- `frontmatter`: los datos entre las líneas `---` del inicio.
- `headings`: nivel, texto e `id` de cada encabezado, para armar una tabla de contenido.
- `html`: el documento como HTML.
- La exportación por defecto es un componente: `<Post class="prose" />`.

## Una carpeta de artículos, con tipos

```ts
import { defineCollection } from "jota-js/content";

const posts = defineCollection(import.meta.glob("./posts/*.md", { eager: true }), {
  title: "string",
  date: "string",
  draft: "boolean?",
});
```

Si a un archivo le falta un campo o tiene el tipo equivocado, el build se detiene y dice cuál es.

## Qué revisa el build

| Problema | Resultado |
|---|---|
| Imagen sin texto alternativo | El build falla y nombra el archivo |
| Encabezado que se salta un nivel | Un aviso |

Se desactiva con `jotaMarkdown({ guard: false })`.

## Límites

El HTML que escribas dentro del Markdown no se limpia: úsalo solo con contenido propio. No se admiten componentes dentro del Markdown (MDX).
