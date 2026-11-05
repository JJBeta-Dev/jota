<div align="center">

<img src="assets/logo.svg" alt="Jota" width="320">

**Escribe JSX/TSX normal. Publica páginas rápidas, accesibles y semánticas. Si no lo haces, el build falla.**

[English](README.md) · [Español](README.es.md)

![estado](https://img.shields.io/badge/estado-pre--alpha-orange) ![licencia](https://img.shields.io/badge/licencia-MIT-blue) ![typescript](https://img.shields.io/badge/TypeScript-primero-3178c6)

</div>

> **Estado: pre-alpha, etapa de planeación.** Todavía no hay nada publicado en npm. Este README describe el diseño objetivo para que quienes contribuyan o prueben temprano sepan hacia dónde va Jota. Las secciones marcadas con 🚧 aún no están implementadas. Mira [PLAN.md](PLAN.md) para la hoja de ruta y [IA.md](IA.md) para todas las decisiones técnicas.

## ¿Qué es Jota?

Jota es un toolkit frontend construido sobre tres ideas:

1. **Reactividad fina, sin Virtual DOM.** Los componentes se ejecutan una sola vez; solo se actualiza el nodo del DOM exacto ligado al valor que cambió. Sin `useMemo`, sin `useCallback`, sin re-renders en cascada.
2. **JSX y TypeScript normales.** Los archivos son `.tsx` (TypeScript) o `.jsx` (JavaScript) comunes. No hay extensión propia, así que tu editor, ESLint, Prettier y GitHub funcionan sin plugins.
3. **Guardas en tiempo de build.** El compilador revisa accesibilidad, semántica y presupuestos de rendimiento. Un `<div onClick>` sin rol o un `<img>` sin `alt` rompe el build, con un mensaje que te dice cómo corregirlo.

Jota no promete "100% en todas las métricas". Promete un **presupuesto de rendimiento verificado en CI** que tú controlas.

## Hoja de ruta

| Etapa | Qué | Estado |
|---|---|---|
| 1 | **Jota Guard**: plugin de ESLint + CLI que audita cualquier proyecto JSX/TSX | ✅ construido y probado, aún sin lanzar |
| 2 | Runtime de signals + plugin de Vite con JSX compilado | ✅ construido y probado, aún sin lanzar |
| 3 | Rutas por archivos, generación estática, generador de proyectos, sitio de docs | ✅ construido y probado, aún sin lanzar (faltan islas dentro de una página, CSS crítico real y conversión de imágenes) |
| 4 | Docs en inglés y español, playground, ejemplos | 🚧 sitio de docs y ejemplo de tareas listos (`site/`, `examples/hello`); faltan el playground y más ejemplos |

## Instalación 🚧

> Estos comandos funcionarán cuando se publiquen los primeros paquetes. Se muestran para que la experiencia objetivo quede clara.

**Auditar un proyecto existente (Jota Guard, primer lanzamiento):**

```bash
npx jota-guard
```

**Crear una app nueva con Jota (TypeScript por defecto):**

```bash
npm create jota-js@latest mi-app
cd mi-app
npm install
npm run dev
```

Requisitos: Node.js 20 o superior.

## Ejemplo rápido 🚧

Un contador en TypeScript. La función del componente se ejecuta **una sola vez**; solo se actualiza el nodo de texto cuando cambia `count`.

```tsx
// src/Counter.tsx
import { signal } from "jota-js";

export function Counter() {
  const [count, setCount] = signal(0);

  return (
    <section>
      <h2>Contador</h2>
      <p>Clics: {count()}</p>
      <button type="button" onClick={() => setCount(count() + 1)}>
        Sumar uno
      </button>
    </section>
  );
}
```

El mismo componente en JavaScript es idéntico sin los tipos, en un archivo `.jsx`.

## Ejemplo de guardas 🚧

```tsx
// ❌ Esto rompe el build
<div onClick={openMenu}>Abrir</div>
<img src="/photo.jpg" />

// ✅ Corrección sugerida por Jota
<button type="button" onClick={openMenu}>Abrir</button>
<img src="/photo.jpg" alt="Equipo trabajando en el estudio" width="800" height="600" />
```

Mensaje de ejemplo (los mensajes del producto están en inglés):

```text
jota/img-alt  <img> needs an `alt` attribute.
Describe the image, or use alt="" if it is purely decorative.
More: https://github.com/JJBeta-Dev/jota/blob/main/docs/guard-rules.md#img-alt
```

Primer lote de reglas: `div`/`span` clicable sin rol, `img` sin `alt`, orden de encabezados, inputs sin label, imágenes sin `width`/`height`, `html` sin `lang`, botones sin nombre accesible.

## Presupuesto de rendimiento 🚧

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

Si una ruta supera el presupuesto, el build falla e indica qué recurso lo causó.

## Qué está medido hoy

- El ejemplo de tareas (`examples/hello`) compila a 6.18 kB de JavaScript (2.65 kB con gzip), con runtime y CSS incluidos.
- El sitio de documentación (`site/`) genera 8 páginas **sin JavaScript**, de unos 6 kB de HTML cada una.
- Los micro-benchmarks de reactividad contra Solid y Preact Signals están en [bench/RESULTS.md](bench/RESULTS.md): Jota está en el rango de Solid y es más lento que Preact Signals. Miden el grafo reactivo en Node, no páginas reales en un navegador.

## Estructura del proyecto

```text
jota/
├─ packages/
│  ├─ guard/             # plugin de ESLint + CLI (Etapa 1)
│  ├─ core/              # runtime de signals (Etapa 2)
│  ├─ vite-plugin/       # JSX compilado (Etapa 2)
│  └─ create-jota-js/    # generador de proyectos (Etapa 3)
├─ docs/                 # sitio de documentación (Etapa 4)
├─ assets/               # logo e imágenes
├─ IA.md                 # contexto y decisiones para agentes de IA
├─ PLAN.md               # plan por etapas
└─ CHANGELOG.md
```

## Contribuir

El proyecto está en etapa de planeación. Las ideas y sugerencias de reglas serán bienvenidas por medio de issues de GitHub cuando el repositorio sea público. Lee primero [IA.md](IA.md): explica qué entra y qué no en la v1.

## Licencia

[MIT](LICENSE) © JJBeta. Jota reutiliza ideas y, en etapas posteriores, código con licencia MIT del ecosistema de Solid (`dom-expressions`), con atribución.
