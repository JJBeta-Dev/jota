import type { JSXElement } from "jota-js";
import { Code, Layout } from "../../components/Layout";

export const head = {
  title: "Getting started | Jota",
  description: "Create a Jota app, run it, and check it with Jota Guard.",
  lang: "en",
};

export default function GettingStarted(): JSXElement {
  return (
    <Layout lang="en" path="/docs/getting-started">
      <h1>Getting started</h1>

      <p>
        Want to try it first? The <a href="/playground">playground</a> compiles and runs your code in the browser, with
        nothing to install.
      </p>

      <h2>Create an app</h2>
      <Code
        code={`npm create jota-js@latest my-app
cd my-app
npm install
npm run dev`}
      />
      <p>
        Add <code>-- --template js</code> for JavaScript. Requirements: Node.js 20 or newer.
      </p>

      <h2>What you get</h2>
      <ul>
        <li>
          <code>src/App.tsx</code>: a counter component.
        </li>
        <li>
          <code>vite.config.ts</code>: Vite with <code>vite-plugin-jota</code>.
        </li>
        <li>
          <code>npm run guard</code>: accessibility checks.
        </li>
      </ul>

      <h2>Use it in an existing Vite project</h2>
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

      <h2>Check your pages</h2>
      <Code code={`npx jota-guard src`} />
      <p>
        See <a href="/docs/guard">Guard</a> for the rules and how to change their severity.
      </p>
    </Layout>
  );
}
