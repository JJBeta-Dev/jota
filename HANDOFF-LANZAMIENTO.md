# Lanzamiento de Jota: lo que te toca a ti

Actualizado el 2026-11-13. Todo lo de abajo ya está preparado; solo faltan pasos que piden tu cuenta o tu PIN.

## 1. Qué quedó listo en esta ronda

| Qué | Cómo comprobarlo |
|---|---|
| Comentarios solo JSDoc en todo el repo, con chequeo en CI | `node scripts/check-comments.mjs` |
| Guard: `--fix`, `--format sarif`, `--format github` (372 tests) | `pnpm --filter jota-guard test` |
| Lighthouse CI: 95+ rendimiento, 100 accesibilidad, SEO y buenas prácticas | pestaña Actions, flujo "Lighthouse" |
| Markdown como contenido, con chequeo de `alt` y encabezados en el build | `examples/blog/src/content/` y `pnpm --filter blog-jota test` |
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

Sí: el build falla ante HTML inaccesible o pesado; el bundle es el más pequeño de la comparación (3.4 kB gzip frente a 69.8 kB de React); cero JavaScript por defecto.

No: "el más rápido". Los números propios muestran que está en el rango de Solid y que crear nodos reactivos es 3 a 4 veces más lento que Preact Signals. Decirlo de frente da más credibilidad que esconderlo.

## 7. Lo que sigue pendiente (por orden de impacto)

1. Extensión de VS Code para Guard y auditoría con axe en los tests (`jota-js/testing`).
2. Enviar Jota a js-framework-benchmark (números de terceros).
3. Prefetch de enlaces y transiciones de vista.
4. Página de docs para Markdown en el sitio y traducción completa al español.
5. Formularios accesibles, caché de datos, i18n y componentes sin estilo.
6. Decidir el nombre (similitud con Jotai) antes de una versión 2.0.
