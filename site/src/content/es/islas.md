---
title: Islas y opciones del build
description: Partes interactivas dentro de páginas estáticas, imágenes, CSS crítico y presupuesto de rendimiento.
order: 4
---

# Islas y opciones del build

Una isla es una parte interactiva dentro de una página estática. Solo las páginas con islas cargan JavaScript.

```tsx
import { Island } from "jota-js";
import { Newsletter } from "../components/Newsletter";

<Island name="newsletter" load="visible">
  <Newsletter />
</Island>;
```

En el archivo de entrada:

```tsx
import { startIslands } from "jota-js";
import { Newsletter } from "./components/Newsletter";

startIslands({ newsletter: () => <Newsletter /> });
```

| `load` | Cuándo se activa |
|---|---|
| `"load"` | Al cargar la página |
| `"idle"` | Cuando el navegador está libre |
| `"visible"` | Cuando la isla entra en pantalla |

La isla reutiliza el HTML del build. Si el usuario ya escribió algo, se conserva.

## Presupuesto de rendimiento

```ts
jotaStatic({
  budget: { maxJsPerRoute: "10kb", maxCssPerRoute: "20kb", maxHtmlPerRoute: "50kb", maxImageWeight: "200kb" },
});
```

Si una página se pasa, el build falla y dice cuál fue.

## Imágenes y CSS

- `images: true` convierte las imágenes a AVIF y WebP (requiere `sharp`) y las envuelve en `<picture>`.
- La primera imagen recibe `fetchpriority="high"`; las demás, `loading="lazy"`.
- Las hojas de estilo de hasta 20 kB se incrustan en la página. Por encima de eso se incrusta solo el CSS crítico y el resto carga sin bloquear.

## Renderizar en el servidor

```ts
import { renderToString } from "jota-js/server";

const html = await renderToString(() => <Page />);
```

Sirve para generar la página en cada petición. No hay streaming: los datos se cargan antes de renderizar.
