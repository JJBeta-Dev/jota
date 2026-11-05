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
- [ ] Instalar pnpm (`corepack enable`) y configurar workspace
- [ ] Escribir manifiesto de 1 página
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
- [ ] Benchmarks contra Solid y React (pendiente; el criterio de la puerta no está verificado)
- **Puerta:** benchmarks razonables frente a Solid; tests en verde (los tests están; faltan los benchmarks).

### Etapa 3 — Router + SSG + islas + CSS (6-8 semanas)
- [ ] Rutas por archivos (`routes/`), SSG y SPA
- [ ] CSS con alcance local, utilidades atómicas opcionales, CSS crítico en el build
- [ ] Islas (JS solo donde hay interactividad)
- [ ] Plugin de medios (`sharp`, `width/height`, `fetchpriority`, `lazy`)
- [ ] `npm create jota-js@latest` con plantillas TS (por defecto) y JS
- **Puerta:** sitio demo con 95+ en Lighthouse móvil y menos de 10 KB de JS en páginas de contenido.

### Etapa 4 — Docs y comunidad (3-4 semanas)
- [ ] Docs en inglés (principal) y español (i18n de Starlight)
- [ ] Playground (StackBlitz) y 5 ejemplos: blog, landing, dashboard, docs, tienda
- [ ] Capturas/SVG con Playwright si hacen falta
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
