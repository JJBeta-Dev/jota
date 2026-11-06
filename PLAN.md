# PLAN.md — Plan de Jota (español)

Presupuesto: **$0**. Producto en inglés primero (TypeScript-first), docs en español como segundo idioma. Contexto y decisiones técnicas: ver [IA.md](IA.md).

## Qué promete Jota
- Reactividad fina (sin Virtual DOM) y JSX compilado a operaciones DOM directas.
- **Guardas de a11y, semántica y presupuesto de rendimiento que rompen el build** (el diferenciador).
- Una curva de aprendizaje baja: archivos `.tsx` / `.jsx` normales, sin extensión propia.
- Honestidad: no se promete "100% garantizado"; se promete un presupuesto verificado en CI (Lighthouse 95+ en el sitio demo).

## Etapas y puertas de decisión

### Etapa 0 — Fundamentos (1-2 semanas)
- [x] Carpeta del proyecto, `git init` local (sin commits)
- [x] `IA.md`, `PLAN.md`, `CHANGELOG.md`, `README.md`, `README.es.md`
- [x] `LICENSE` MIT, `.gitignore`, `package.json` raíz (1.0.0), `tsconfig.base.json`, logo SVG
- [x] Verificar nombres en npm / GitHub (paquetes sin scope: `jota-js`, `jota-guard`, `create-jota-js`, `vite-plugin-jota`; repo `JJBeta-Dev/jota`)
- [x] Nombres reservados en npm el 2026-11-03 (cuenta `jjbeta`, 2FA con Windows Hello): `jota-js`, `jota-guard`, `create-jota-js` y `vite-plugin-jota` tienen `0.0.1` publicada y como `latest` (verificado el 2026-11-05; también existe una versión `0.0.0-stage` que creó npm)
- [x] pnpm activado con `corepack` (9.15.0) y workspace configurado (`packages/*`, `examples/*`, `site`, `bench`)
- [x] Manifiesto: la sección "What is Jota?" del README y la página de inicio del sitio de docs
- **Puerta:** nombres asegurados y horario semanal definido (sugerido 6-8 h).

### Etapa 1 — Jota Guard, independiente (3-5 semanas)
- [x] Especificación de reglas `docs/guard-rules.md` (borrador, pendiente de tu revisión) **antes de código**
- [x] Plugin de ESLint + CLI `jota-guard` (presets `recommended`, `strict`, `a11y-only`; `--format`, `--max-warnings`, `--ignore`): 130 tests en verde
- [x] Reglas iniciales (10 implementadas y probadas): `div`/`span` clicable sin rol, `img` sin `alt`, orden de encabezados, inputs sin label, imágenes sin `width/height`, `html` sin `lang`, botones sin nombre accesible
- [x] Proyecto de ejemplo `examples/guard-demo` con violaciones plantadas y tests de Vitest
- [ ] Publicar `jota-js/guard` en npm (con provenance) y anunciar
- **Puerta:** 100+ estrellas o 500+ descargas semanales a ~6 semanas del lanzamiento, o feedback claro para ajustar. Si no hay tracción, detener o redirigir (~2 meses gastados).

### Etapa 2 — Runtime + compilador (6-10 semanas)
- [x] Núcleo de signals (`signal`, `computed`, `effect`, `batch`, `untrack`, `createRoot`, `onCleanup`), TS estricto: 19 tests
- [x] Plugin de Vite con JSX compilado (reutilizando `babel-plugin-jsx-dom-expressions`, MIT) y runtime DOM propio (`jota-js/web`)
- [x] `Show`, `For`, `mergeProps`, `splitProps`, `render`
- [x] Pruebas de extremo a extremo (11): el contador actualiza solo su nodo de texto, el componente corre una vez, las listas reutilizan nodos
- [x] App de ejemplo `examples/hello` (todo-app): 4 tests, pasa Jota Guard y compila a 6.18 kB de JS (2.65 kB gzip) incluyendo runtime y CSS
- [x] Benchmarks de reactividad contra Solid y Preact Signals (`bench/`, resultados en `bench/RESULTS.md`): Jota queda en el rango de Solid (más rápido en 2 de 6 escenarios, hasta 2x más lento en otros) y más lento que Preact Signals. Son micro-benchmarks en Node, sin DOM. La comparación de renderizado en navegador real está en `bench/browser/RESULTS.md`: a menos de ~10% de Solid en casi todo y con un bundle menor (2.9 vs 4.6 kB gzip); no hay comparación contra React
- [x] Tipos de JSX por elemento (HTML estándar y SVG común, eventos con `currentTarget` tipado, `data-*`/`aria-*`, elementos personalizados), verificados con `@ts-expect-error` en `packages/vite-plugin/test/jsx-types.check.tsx`
- [x] Reconciliación de listas con subsecuencia creciente más larga (intercambiar dos filas pasó de 22 ms a 1.7 ms en el navegador; 200 reordenamientos aleatorios en las pruebas)
- **Puerta:** benchmarks razonables frente a Solid; tests en verde. Cumplida, también en un navegador real (Edge).

### Etapa 3 — Router + SSG + islas + CSS (6-8 semanas)
- [x] Rutas por archivos (`src/routes`): `createRoutes`, `matchRoute`, `buildPath`, `startRouter` con navegación en el cliente (33 tests en core) y SSG con `vite-plugin-jota/static` (9 tests: páginas estáticas sin JS, rutas `client`, rutas dinámicas con `paths`, `head`, 404, sitemap)
- [x] CSS: hojas de hasta 20 kB incrustadas completas; por encima, CSS crítico real por página con `beasties` y carga del resto sin bloquear (2 tests). Faltan CSS con alcance local por componente y utilidades atómicas (no están en la v1 acordada)
- [x] Islas: `<Island>` + `startIslands` (`load`, `idle`, `visible`); la página sigue siendo estática y solo conserva su script si contiene una isla (se vuelve a montar, no hidrata). 8 tests en core y 1 de extremo a extremo
- [x] Medios: `fetchpriority="high"` en la primera imagen, `loading="lazy"` en el resto y conversión a AVIF/WebP con `sharp` (opcional) con `<picture>` (1 test)
- [x] `create-jota-js` con plantillas TS (por defecto) y JS: 10 tests; verificado a mano que un proyecto generado compila (4.90 kB JS, 2.11 kB gzip), pasa el chequeo de tipos y pasa Guard. Su `npm install` real espera al primer lanzamiento (`^1.0.0`)
- **Puerta:** sitio demo con 95+ en Lighthouse móvil y menos de 10 KB de JS en páginas de contenido.

### Etapa 4 — Docs y comunidad (3-4 semanas)
- [x] Sitio de docs `site/` hecho con Jota (inglés completo, español para inicio y primeros pasos): 8 páginas sin JavaScript, Guard sin avisos con `--max-warnings 0`. No usa Starlight; el despliegue a GitHub Pages queda en `.github/workflows/pages.yml` (solo manual, requiere repo público o plan de pago)
- [x] Ejemplos con tests y Guard: `examples/hello` (tareas), `examples/blog` (estático, rutas dinámicas, datos asíncronos), `examples/landing` (isla de newsletter), `examples/dashboard` (signals, For, Show, SVG). El playground (abajo) no necesita paquetes publicados
- [x] Playground en el navegador (`/playground` del sitio de docs): compila TSX con el mismo compilador (Babel en el navegador, ~445 kB gzip, solo se descarga en esa página) y lo ejecuta en un iframe con el runtime del sitio; 8 tests, 5 de ellos en un navegador real. Las demás páginas siguen sin JavaScript
- [x] No hicieron falta capturas con Playwright: el logo es un SVG propio y Lighthouse se midió con Edge
- **Puerta:** 5 testers externos califican las docs como claras.

### Etapa 5 — Lanzamiento 0.x (1-2 semanas)
- [ ] Show HN, r/javascript, r/webdev, r/reactjs, dev.to, X, Product Hunt, newsletters
- [ ] Revisión de un nativo para README y posts
- **Puerta:** corregir los 5 problemas principales en 2 semanas.

### Etapa 6 — Hacia 1.0 (continuo)
- [ ] Triage de issues, proceso de RFC, versionado semántico, roadmap público
- [ ] Monetización opcional: GitHub Sponsors, Jota Guard Pro, plantillas, educación
- [ ] Decisión de renombrado (por la similitud con Jotai) antes de congelar la API
- **Puerta:** 1.0 solo con API estable.

## Infraestructura $0
GitHub (repo público + Actions), npm, Cloudflare Pages o GitHub Pages, StackBlitz, Lighthouse CI. Dominio propio opcional (~$10/año), no necesario. Pagos más adelante: Lemon Squeezy / Gumroad (solo comisión).

## Riesgos y mitigaciones
| Riesgo | Mitigación |
|---|---|
| Crecimiento del alcance | La lista de v1 es una línea dura; lo demás va a "más adelante" |
| Sin adopción | Puertas tras Etapas 1 y 3; cada etapa sirve por sí sola |
| Agotamiento del mantenedor | Horas semanales fijas, roadmap público, `good first issue` desde la Etapa 2 |
| Confusión con Jotai | Marca "Jota by JJBeta", paquete `jota-js`, puerta de renombrado antes del 1.0 |
| Bugs del compilador | Tests de transformación, snapshots, casos tipo Solid |
| Cadena de suministro | 2FA en npm, provenance, lockfile, Dependabot |
| Legal | MIT; conservar avisos de dom-expressions/Solid |

## Verificación por etapa
- **Etapa 1:** `npx jota-guard` sobre el ejemplo reporta las violaciones con código de salida 1; pasa en la versión corregida.
- **Etapa 2:** Vitest en verde; el contador actualiza solo su nodo de texto (Paint flashing + contador de renders); benchmark versionado.
- **Etapa 3:** `npm create jota-js@latest` funciona en máquina limpia (Windows y Linux en CI); Lighthouse CI exige 95+ rendimiento y 100 en accesibilidad y SEO.
- **Etapa 4:** docs compilan en ambos idiomas; enlaces verificados en CI.
- **Costo:** ningún plan de pago en uso antes de la Etapa 6.
