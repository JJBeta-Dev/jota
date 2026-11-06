<div align="center">

<img src="assets/logo.svg" alt="Jota" width="320">

**Escribe JSX/TSX normal. Publica páginas rápidas y accesibles. Haz que el build falle cuando no lo sean.**

[English](README.md) · [Español](README.es.md)

![estado](https://img.shields.io/badge/estado-pre--alpha-orange) ![licencia](https://img.shields.io/badge/licencia-MIT-blue) ![typescript](https://img.shields.io/badge/TypeScript-primero-3178c6)

</div>

> **Estado: 1.0.0, joven.** Los cuatro paquetes están en npm y el código tiene pruebas (la integración continua corre en Node 20 y 22, en Linux y Windows), pero Jota es nuevo, aún no tiene usuarios externos y su API todavía puede cambiar. No tiene hidratación (las islas se vuelven a montar). [PLAN.md](PLAN.md) tiene la hoja de ruta y [IA.md](IA.md) todas las decisiones técnicas.

## ¿Qué es Jota?

Jota es un toolkit frontend construido sobre tres ideas:

1. **Reactividad fina, sin Virtual DOM.** Un componente se ejecuta una sola vez; solo se actualiza el nodo del DOM que lee el valor que cambió. No hay `useMemo`, ni `useCallback`, ni cascadas de re-renders.
2. **JSX y TypeScript normales.** Los archivos son `.tsx` o `.jsx` comunes. No hay extensión propia, así que tu editor, ESLint, Prettier y GitHub funcionan sin plugins.
3. **Revisiones de accesibilidad que rompen el build.** Jota Guard (un plugin de ESLint y una herramienta de línea de comandos) rechaza un `<div onClick>` sin rol o un `<img>` sin `alt`, y te dice cómo corregirlo. Un presupuesto de rendimiento también puede romper el build.

Jota no promete "100% en todas las métricas". Te da límites medibles y los comprueba por ti.

## Qué hay en este repositorio

| Paquete | Qué hace |
|---|---|
| [`jota-guard`](packages/guard) | Veintiséis reglas de accesibilidad y semántica, como plugin de ESLint y como comando `jota-guard` |
| [`jota-js`](packages/core) | Signals, `Show` y `For`, un router por archivos, islas y el runtime del DOM para el JSX compilado |
| [`vite-plugin-jota`](packages/vite-plugin) | Compila `.tsx`/`.jsx`; generación de sitios estáticos con datos asíncronos, imágenes AVIF/WebP, CSS crítico y presupuesto de rendimiento |
| [`create-jota-js`](packages/create-jota-js) | Crea una app nueva en TypeScript o JavaScript |

También hay: el sitio de documentación con un playground en el navegador ([`site/`](site)), cuatro apps de ejemplo ([`examples/`](examples)) y benchmarks ([`bench/`](bench)).

## Instalación

```bash
npm create jota-js@latest mi-app     # una app nueva, TypeScript por defecto
cd mi-app
npm install
npm run dev

npx jota-guard src                   # o solo audita un proyecto JSX/TSX existente
```

Requisitos: Node.js 20 o superior.

### Trabajar en Jota (desde este repositorio)

```bash
git clone https://github.com/JJBeta-Dev/jota.git
cd jota
corepack enable
pnpm install
pnpm -r build
pnpm --filter jota-site dev          # el sitio de docs y el playground
pnpm --filter hello-jota dev         # el ejemplo de tareas
```

## Un contador

La función del componente se ejecuta **una sola vez**; solo cambia el nodo de texto cuando cambia `count`.

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

## Guardas

```tsx
// Esto falla la revisión
<div onClick={openMenu}>Abrir</div>
<img src="/photo.jpg" />

// Esto pasa
<button type="button" onClick={openMenu}>Abrir</button>
<img src="/photo.jpg" alt="Equipo trabajando en el estudio" width="800" height="600" />
```

`npx jota-guard src` imprime (los mensajes del producto están en inglés):

```text
src/Header.tsx
  8:3  error  <div> with onClick is not keyboard accessible. Use <button type="button"> (or <a href>) instead  jota/clickable-role
  9:3  error  <img> needs an `alt` attribute. Describe the image, or use alt="" if it is purely decorative      jota/img-alt
```

Las reglas: `div`/`span` clicable sin rol, `img` sin `alt`, `img` sin `width`/`height`, botones y enlaces sin nombre accesible, inputs sin etiqueta, orden de encabezados, `html` sin `lang`, `tabIndex` positivo y `video` sin subtítulos. Dos de ellas avisan por defecto y se pueden convertir en error. Mira [packages/guard](packages/guard) y [docs/guard-rules.md](docs/guard-rules.md).

## Páginas estáticas y presupuesto de rendimiento

```ts
// vite.config.ts
import { defineConfig } from "vite";
import jota from "vite-plugin-jota";
import jotaStatic from "vite-plugin-jota/static";

export default defineConfig({
  plugins: [
    jota(),
    jotaStatic({
      site: "https://example.com",
      images: true, // AVIF y WebP, con <picture>
      budget: { maxJsPerRoute: "10kb", maxCssPerRoute: "20kb", maxImageWeight: "200kb" },
    }),
  ],
});
```

Cada archivo de `src/routes` se convierte en una página HTML sin JavaScript, salvo que la ruta lo pida. Si una página supera el presupuesto, el build falla y dice qué página y por cuánto.

## Qué se ha medido

- El ejemplo de tareas (`examples/hello`) compila a 6.18 kB de JavaScript (2.65 kB con gzip), con runtime y CSS incluidos.
- Nueve de las diez páginas del sitio de documentación no contienen JavaScript. Lighthouse (local, emulación móvil) da 100 en rendimiento, accesibilidad, buenas prácticas y SEO en cuatro de ellas: [bench/lighthouse/RESULTS.md](bench/lighthouse/RESULTS.md). Es un sitio estático pequeño y una medición local, no datos de campo.
- En un navegador real (Edge), la misma tabla en Jota y en Solid queda a menos de un 10% en casi todas las operaciones, y el bundle de Jota es menor (2.9 kB con gzip contra 4.6 kB): [bench/browser/RESULTS.md](bench/browser/RESULTS.md). Una máquina, un navegador; no es el js-framework-benchmark oficial.
- Los micro-benchmarks de reactividad contra Solid y Preact Signals están en [bench/RESULTS.md](bench/RESULTS.md): Jota le gana a Solid en cuatro de seis escenarios y sigue siendo más lento que Preact Signals. Miden el grafo reactivo en Node, no páginas reales.

## Límites conocidos

- Las islas y las rutas de cliente se montan de nuevo en el navegador; no hay hidratación del HTML del servidor.
- Las páginas se renderizan una vez al compilar. No hay renderizado en el servidor por petición.
- No hay estilos con alcance por componente ni utilidades de CSS atómico.

## Estructura del proyecto

```text
jota/
├─ packages/        guard, core (jota-js), vite-plugin, create-jota-js
├─ site/            sitio de documentación y playground, hecho con Jota
├─ examples/        hello (tareas), blog, landing, dashboard, guard-demo
├─ bench/           benchmarks de reactividad y de navegador, resultados de Lighthouse
├─ docs/            especificación de las reglas de Guard
├─ scripts/         ayudante de lanzamiento (ver RELEASING.md)
├─ IA.md            contexto y decisiones para agentes de IA
├─ PLAN.md          plan por etapas
└─ CHANGELOG.md
```

## Contribuir

Las ideas, los reportes de errores y las sugerencias de reglas serán bienvenidos mediante issues de GitHub cuando el repositorio sea público. Lee primero [IA.md](IA.md): explica qué entra y qué no en la versión 1.

## Licencia

[MIT](LICENSE) © JJBeta. La compilación de JSX usa `babel-plugin-jsx-dom-expressions` (MIT), la familia de compiladores detrás de Solid, y el CSS crítico usa `beasties` (Apache-2.0).
