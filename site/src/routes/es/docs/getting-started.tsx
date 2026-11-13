import type { JSXElement } from "jota-js";
import { Code, Layout } from "../../../components/Layout";

export const head = {
  title: "Primeros pasos | Jota",
  description: "Crea una app con Jota, ejecútala y revísala con Jota Guard.",
  lang: "es",
};

export default function PrimerosPasos(): JSXElement {
  return (
    <Layout lang="es" path="/es/docs/getting-started">
      <h1>Primeros pasos</h1>

      <p>
        ¿Quieres probarlo antes? El <a href="/playground">playground</a> (en inglés) compila y ejecuta tu código en el
        navegador, sin instalar nada.
      </p>

      <h2>Crear una app</h2>
      <Code
        code={`npm create jota-js@latest mi-app
cd mi-app
npm install
npm run dev`}
      />
      <p>
        Añade <code>-- --template js</code> para JavaScript. Requisito: Node.js 20 o superior.
      </p>

      <h2>Qué incluye</h2>
      <ul>
        <li>
          <code>src/App.tsx</code>: un componente contador.
        </li>
        <li>
          <code>vite.config.ts</code>: Vite con <code>vite-plugin-jota</code>.
        </li>
        <li>
          <code>npm run guard</code>: revisiones de accesibilidad.
        </li>
      </ul>

      <h2>Usarlo en un proyecto Vite existente</h2>
      <Code
        code={`npm install jota-js
npm install -D vite-plugin-jota`}
      />
      <Code
        code={`// vite.config.ts
import { defineConfig } from "vite";
import jota from "vite-plugin-jota";

export default defineConfig({ plugins: [jota()] });`}
      />
      <Code
        code={`// tsconfig.json
{ "compilerOptions": { "jsx": "preserve", "jsxImportSource": "jota-js" } }`}
      />

      <h2>Revisar tus páginas</h2>
      <Code code={`npx jota-guard src`} />
      <p>
        Cambia la severidad de una regla con <code>--rule heading-order=error</code> o con un archivo{" "}
        <code>jota.config.json</code>. Las reglas completas están en <a href="/docs/guard">Guard</a> (en inglés).
      </p>
    </Layout>
  );
}
