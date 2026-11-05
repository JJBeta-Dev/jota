import type { JSXElement } from "jota-js";
import { Code, Layout } from "../../components/Layout";

export const head = {
  title: "Jota: un toolkit frontend con guardas de accesibilidad",
  description:
    "Reactividad fina sin Virtual DOM, TSX normal y comprobaciones que rompen el build cuando una página no es accesible.",
  lang: "es",
};

export default function Inicio(): JSXElement {
  return (
    <Layout lang="es" path="/es">
      <p>
        <span class="badge">Pre-alpha</span>
      </p>
      <h1>
        Un frontend que <span class="accent">se revisa solo</span>
      </h1>
      <p class="lead">
        Escribe TSX normal. Los componentes se ejecutan una sola vez, solo se actualiza el nodo del DOM que depende de un
        valor, y el build falla cuando una página no es accesible.
      </p>
      <div class="actions">
        <a class="button" href="/es/docs/getting-started">
          Primeros pasos
        </a>
        <a class="button secondary" href="/docs/guard">
          Reglas de Guard (en inglés)
        </a>
      </div>

      <div class="cards">
        <section class="card">
          <h2>Sin re-renders</h2>
          <p>
            Los signals actualizan el nodo de texto o el atributo exacto que los lee. No hay Virtual DOM ni{" "}
            <code>useMemo</code>.
          </p>
        </section>
        <section class="card">
          <h2>Guardas</h2>
          <p>
            Jota Guard rompe el build con un <code>div</code> con <code>onClick</code>, una imagen sin <code>alt</code> o un
            campo sin etiqueta.
          </p>
        </section>
        <section class="card">
          <h2>Páginas sin JavaScript</h2>
          <p>Las rutas son HTML estático por defecto. Solo las rutas que marques como interactivas cargan JavaScript.</p>
        </section>
      </div>

      <h2>Un contador</h2>
      <Code
        code={`import { signal, render } from "jota-js";

function Contador() {
  const [cuenta, setCuenta] = signal(0);
  return (
    <button type="button" onClick={() => setCuenta(cuenta() + 1)}>
      Clics: {cuenta()}
    </button>
  );
}

render(() => <Contador />, document.getElementById("app")!);`}
      />
      <p>
        <code>Contador</code> se ejecuta una vez. Cada clic cambia un nodo de texto.
      </p>

      <h2>Estado real</h2>
      <p class="note">
        Jota está en pre-alpha. El runtime, el compilador, el router, la generación estática y Guard funcionan y tienen
        pruebas, pero todavía no hay un primer lanzamiento y no hay benchmarks en navegador contra otros frameworks. Se
        construye en abierto en <a href="https://github.com/JJBeta-Dev/jota">github.com/JJBeta-Dev/jota</a>. La
        documentación completa está en inglés; esta traducción cubre lo esencial.
      </p>
    </Layout>
  );
}
