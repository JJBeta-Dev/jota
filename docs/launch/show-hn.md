# Launch drafts

Every claim below links to something in the repository that anyone can run. Do not add numbers that are not there.
A native English speaker should read these before they are posted.

## Show HN

**Title:** Show HN: Jota – a JSX framework whose build fails on inaccessible or heavy pages

**Text:**

Hi HN. I'm a designer and front-end developer from Colombia. Jota is a small TypeScript framework I built around one idea: the checks we usually skip should be part of the build.

- **Accessibility rules that fail the build.** Jota Guard has 31 rules for JSX (a `<div onClick>` with no role, an image with no alt, an input with no label, invalid ARIA...). It ships as a CLI and an ESLint plugin and works on React or Solid code too. `--fix` repairs only what is safe; it never invents alt text.
- **A performance budget that fails the build.** You set a limit of JavaScript, CSS, HTML and image weight per route; the build names the page that went over.
- **No JavaScript by default.** Pages are static HTML. Interactive parts are islands that hydrate on load, idle or when visible. Markdown content is checked too: an image without alt text stops the build.
- **Fine-grained reactivity, no virtual DOM.** Signals, and JSX compiled to direct DOM updates (the compiler builds on dom-expressions, the same base as Solid).

Honest numbers, measured with scripts in the repo: the benchmark table app is 3.4 kB gzip in Jota, 4.7 in Solid, 8.5 in Preact and 69.8 in React. In speed nobody wins clearly at 1,000 rows on my machine; Jota is in the same range as Solid and is not the fastest. Creating reactive nodes is 3 to 4 times slower than Preact Signals in a micro-benchmark, and I say why in the notes.

What it does not have: an ecosystem, streaming server rendering, devtools. It is one person's work and it is young.

Repo: https://github.com/JJBeta-Dev/jota
Try it: `npm create jota-js@latest`

I'd value feedback on the Guard rules most: false positives are bugs to me.

## Reddit (r/javascript, r/webdev)

**Title:** I built a JSX framework whose build fails when a page is inaccessible or too heavy

Same body as above, shorter: keep the four bullets, the size table and the "what it does not have" paragraph. Reddit rewards the limits being stated first.

## X / short post

Jota: a small JSX framework where the build fails if you ship a `<div onClick>` without a role, an image without alt, or a page over its JavaScript budget.

Static HTML by default, islands when you need them, signals instead of a virtual DOM. 3.4 kB gzip for a full table app.

github.com/JJBeta-Dev/jota

## Versión en español (dev.to, LinkedIn)

**Título:** Hice un framework JSX cuyo build falla si la página no es accesible o pesa demasiado

Soy diseñador y desarrollador front-end en Colombia. Jota parte de una idea: lo que solemos dejar para después (accesibilidad y peso) debería revisarlo el build.

- **Reglas de accesibilidad que rompen el build:** 31 reglas para JSX. También sirve en proyectos React o Solid.
- **Presupuesto de rendimiento:** límites de JavaScript, CSS, HTML e imágenes por ruta.
- **Cero JavaScript por defecto:** HTML estático, islas para lo interactivo y Markdown revisado.
- **Reactividad fina sin DOM virtual.**

Números medidos con scripts del repositorio: la app de prueba pesa 3.4 kB gzip en Jota, 4.7 en Solid, 8.5 en Preact y 69.8 en React. En velocidad está en el rango de Solid y no es el más rápido. Lo que no tiene: ecosistema, streaming en servidor ni devtools.

Repositorio: https://github.com/JJBeta-Dev/jota
