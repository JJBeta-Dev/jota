export type TemplateName = "ts" | "js";

/** Version range of the Jota packages written into new projects (the first real release). */
export const JOTA_VERSION_RANGE = "^1.2.0";

export interface TemplateContext {
  name: string;
  template: TemplateName;
}

function packageJson({ name, template }: TemplateContext): string {
  const ts = template === "ts";
  const pkg = {
    name,
    private: true,
    version: "0.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview",
      guard: "jota-guard src",
      ...(ts ? { typecheck: "tsc --noEmit" } : {}),
    },
    dependencies: { "jota-js": JOTA_VERSION_RANGE },
    devDependencies: {
      "jota-guard": JOTA_VERSION_RANGE,
      "vite-plugin-jota": JOTA_VERSION_RANGE,
      vite: "^5.4.11",
      ...(ts ? { typescript: "^5.6.3" } : {}),
    },
  };
  return `${JSON.stringify(pkg, null, 2)}\n`;
}

const tsconfig = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "jsxImportSource": "jota-js",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "types": ["vite/client"]
  },
  "include": ["src", "vite.config.ts"]
}
`;

const viteConfig = `import { defineConfig } from "vite";
import jota from "vite-plugin-jota";

export default defineConfig({
  plugins: [jota()],
});
`;

const indexHtml = (name: string, ext: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="A Jota app." />
    <title>${name}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.${ext}"></script>
  </body>
</html>
`;

const mainFile = (ts: boolean): string =>
  ts
    ? `import { render } from "jota-js";
import { App } from "./App";
import "./style.css";

render(() => <App />, document.getElementById("app") as HTMLElement);
`
    : `import { render } from "jota-js";
import { App } from "./App.jsx";
import "./style.css";

render(() => <App />, document.getElementById("app"));
`;

const appFile = (ts: boolean): string =>
  ts
    ? `import { signal, type JSXElement } from "jota-js";

export function App(): JSXElement {
  const [count, setCount] = signal(0);

  return (
    <main>
      <h1>Hello Jota</h1>
      <p>Clicks: {count()}</p>
      <button type="button" onClick={() => setCount(count() + 1)}>
        Add one
      </button>
    </main>
  );
}
`
    : `import { signal } from "jota-js";

export function App() {
  const [count, setCount] = signal(0);

  return (
    <main>
      <h1>Hello Jota</h1>
      <p>Clicks: {count()}</p>
      <button type="button" onClick={() => setCount(count() + 1)}>
        Add one
      </button>
    </main>
  );
}
`;

const styleCss = `body {
  font-family: system-ui, sans-serif;
  margin: 0;
  background: #ececec;
  color: #1a0b3b;
}

main {
  max-width: 32rem;
  margin: 3rem auto;
  padding: 0 1rem;
}

h1 {
  font-size: 2.5rem;
  letter-spacing: -0.04em;
}

button {
  padding: 0.6rem 1.2rem;
  border: 0;
  border-radius: 999px;
  background: #6f3af8;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

button:hover {
  background: #e23af8;
}
`;

const gitignore = `node_modules/
dist/
.env
.env.*
`;

const readme = (name: string, ts: boolean): string => `# ${name}

Created with [Jota](https://github.com/JJBeta-Dev/jota).

\`\`\`bash
npm install
npm run dev      # start the dev server
npm run build    # production build
npm run guard    # accessibility and semantics checks (Jota Guard)${ts ? "\nnpm run typecheck" : ""}
\`\`\`

Edit \`src/App.${ts ? "tsx" : "jsx"}\` and save: only the parts of the page that depend on a changed value update.
`;

/** Every file of a template, as `[relative path, contents]`. */
export function templateFiles(context: TemplateContext): Array<[string, string]> {
  const ts = context.template === "ts";
  const ext = ts ? "tsx" : "jsx";
  const files: Array<[string, string]> = [
    ["package.json", packageJson(context)],
    [`vite.config.${ts ? "ts" : "js"}`, viteConfig],
    ["index.html", indexHtml(context.name, ext)],
    [`src/main.${ext}`, mainFile(ts)],
    [`src/App.${ext}`, appFile(ts)],
    ["src/style.css", styleCss],
    [".gitignore", gitignore],
    ["README.md", readme(context.name, ts)],
  ];
  if (ts) files.push(["tsconfig.json", tsconfig]);
  return files;
}
