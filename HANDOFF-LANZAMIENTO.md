# Lanzamiento de Jota: lo que te toca a ti

Actualizado el 2026-11-13. Todo lo de abajo ya está preparado; solo faltan pasos que piden tu cuenta o tu PIN.

## 1. Qué quedó listo en esta ronda

| Qué | Cómo comprobarlo |
|---|---|
| Comentarios solo JSDoc en todo el repo, con chequeo en CI | `node scripts/check-comments.mjs` |
| Guard: `--fix`, `--format sarif`, `--format github` (372 tests) | `pnpm --filter jota-guard test` |
| Lighthouse CI: 95+ rendimiento, 100 accesibilidad, SEO y buenas prácticas | pestaña Actions, flujo "Lighthouse" |
| Markdown como contenido, con chequeo de `alt` y encabezados en el build | `examples/blog/src/content/` y `pnpm --filter blog-jota test` |
| `jota-js/testing`: render para pruebas y auditoría con axe del DOM renderizado | `packages/core/test/testing.test.tsx` |
| Prefetch y transiciones de vista sin JavaScript (activos en el sitio de docs) | `jotaStatic({ prefetch: true, viewTransitions: true })` |
| Datos, store, i18n, formularios accesibles, pestañas, diálogo y devtools | `packages/core/README.es.md` |
| Extensión de VS Code para Guard | `cd packages/vscode && npm run package` y `code --install-extension jota-guard-vscode-1.2.0.vsix` |
| Docs completas en español en el sitio | `site/src/content/es/` |
| Entrada para js-framework-benchmark | `node bench/browser/check-jfb.mjs` |
| Benchmark en navegador real con React y Preact | `bench/browser/RESULTS.md` |
| Guía para contribuir, política de seguridad, plantillas, Dependabot | `CONTRIBUTING.md`, `SECURITY.md`, `.github/` |
| Borradores de lanzamiento (EN y ES) | `docs/launch/show-hn.md` |

## 2. Publicar la versión 1.2.0 (tú, en una terminal normal)

En npm hoy están `jota-js` 1.1.0 y los otros tres en 1.0.0. Lo nuevo (hidratación, servidor, 21 reglas, Markdown, `--fix`) aún no está publicado.

La versión 1.2.0 ya está preparada: versiones cambiadas, pruebas pasadas, `CHANGELOG.md` actualizado y los cuatro paquetes verificados en la carpeta `release/`. Solo falta publicar:

```bash
cd C:\Users\JJBeta\jota
npm login
node scripts/release.mjs publish
git tag v1.2.0
git push origin main --tags
```

npm abre el navegador y pide el PIN de Windows Hello una vez por paquete (son cuatro).

## 3. Activar en GitHub (2 minutos, en Settings del repo)

1. **General > Features:** activa *Discussions*.
2. **Pages > Source:** *GitHub Actions*; después ejecuta el flujo "Deploy docs site" en la pestaña Actions. El sitio queda en `https://jjbeta-dev.github.io/jota/`.
3. **Code security:** activa *Private vulnerability reporting* (lo menciona `SECURITY.md`).
4. **About (la tuerca en la página del repo):** descripción "The JSX framework whose build fails on inaccessible or heavy pages", y temas `framework`, `accessibility`, `a11y`, `jsx`, `signals`, `typescript`, `static-site-generator`.

## 4. Antes de publicar los posts

- [ ] Una persona nativa lee `README.md`, `docs/launch/show-hn.md` y la página de inicio del sitio.
- [ ] 5 personas prueban `npm create jota-js@latest` y te dicen dónde se trabaron.
- [ ] Sitio de docs desplegado y enlazado en el README.

## 5. Día de lanzamiento (sugerido: martes o miércoles, 8-10 a. m. hora del este de EE. UU.)

1. Show HN con el texto de `docs/launch/show-hn.md`. Quédate respondiendo las primeras dos horas.
2. Una hora después: r/javascript y r/webdev.
3. Ese día o el siguiente: dev.to y LinkedIn en español.
4. Las dos semanas siguientes: responder issues en menos de 24 horas y corregir los 5 problemas más repetidos.

## 6. Qué decir y qué no

Sí: el build falla ante HTML inaccesible o pesado; el bundle es el más pequeño de la comparación (3.7 kB gzip frente a 5.6 de Solid, 13.6 de Svelte, 25.4 de Vue, 37.7 de Angular y 68.5 de React); cero JavaScript por defecto.

No: "el más rápido". Los números propios (siete frameworks, `bench/browser/RESULTS.md`) muestran que Solid, Svelte y Angular son más rápidos, que Jota es entre 20 y 30 % más lento que Solid al crear filas, y que crear nodos reactivos es 3 a 4 veces más lento que Preact Signals. Decirlo de frente da más credibilidad que esconderlo.

## 7. Decisiones que te esperan

- **Nombre:** `docs/decisiones/nombre.md`. Recomendación: lanzar como Jota y revisar a las 4 semanas; mientras tanto reservar `hebra` en npm.
- **Streaming en servidor:** `docs/decisiones/streaming.md`. No se hace en 1.x.

## 8. Lo que sigue pendiente (por orden de impacto)

1. Probar la extensión dentro de VS Code y, si te convence, publicarla en el Marketplace (cuenta de editor gratuita).
2. Enviar la entrada a js-framework-benchmark después de publicar la 1.2.0 (pasos en `bench/js-framework-benchmark/README.md`).
3. Revisar los pull requests de Dependabot: los primeros fallan porque sharp 0.35 y los tipos nuevos de Vite piden cambios de código.
4. MDX, más componentes accesibles (menú, combobox, tooltip, toast) y un panel visual de devtools.
5. Guías de migración desde React, Solid y Svelte, y adaptadores para Cloudflare, Deno y Bun.
