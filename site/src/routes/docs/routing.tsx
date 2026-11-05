import type { JSXElement } from "jota-js";
import { Code, Layout } from "../../components/Layout";

export const head = {
  title: "Routing and static pages | Jota",
  description: "File-based routes, static pages without JavaScript, dynamic routes and client routes.",
  lang: "en",
};

export default function Routing(): JSXElement {
  return (
    <Layout lang="en" path="/docs/routing">
      <h1>Routing and static pages</h1>
      <p class="lead">Files in <code>src/routes</code> become pages. Pages are HTML only unless you ask for JavaScript.</p>

      <h2>Files to URLs</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">File</th>
            <th scope="col">URL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>index.tsx</code>
            </td>
            <td>
              <code>/</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>about.tsx</code>
            </td>
            <td>
              <code>/about</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>blog/[slug].tsx</code>
            </td>
            <td>
              <code>/blog/:slug</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>docs/[...rest].tsx</code>
            </td>
            <td>
              <code>/docs/*rest</code> (catch-all)
            </td>
          </tr>
          <tr>
            <td>
              <code>_anything.tsx</code>
            </td>
            <td>not a route (files and folders starting with an underscore are ignored)</td>
          </tr>
        </tbody>
      </table>

      <h2>A page</h2>
      <Code
        code={`// src/routes/blog/[slug].tsx
export const paths = () => [{ slug: "first-post" }, { slug: "second-post" }];

export const head = (params) => ({
  title: "Post: " + params.slug,
  description: "Reading " + params.slug,
});

export default function Post(props) {
  return <h1>{props.params.slug}</h1>;
}`}
      />
      <ul>
        <li>
          <code>default</code>: the component, receives <code>{"{ params }"}</code>.
        </li>
        <li>
          <code>head</code>: title, description and lang.
        </li>
        <li>
          <code>paths</code>: required for dynamic routes. Without it the route is skipped with a warning.
        </li>
        <li>
          <code>config = {"{ render: \"client\" }"}</code>: keeps the JavaScript so the page becomes interactive.
        </li>
      </ul>

      <h2>Static build</h2>
      <Code
        code={`// vite.config.ts
import jota from "vite-plugin-jota";
import jotaStatic from "vite-plugin-jota/static";

export default defineConfig({
  plugins: [jota(), jotaStatic({ site: "https://example.com" })],
});`}
      />
      <p>After <code>vite build</code> each route is written as its own HTML file. Static pages contain no script tag.</p>
      <p>
        The build also inlines small stylesheets (up to 20 kB), marks the first image <code>fetchpriority="high"</code> and
        the rest <code>loading="lazy"</code>, writes <code>404.html</code> from <code>routes/404.tsx</code>, and writes{" "}
        <code>sitemap.xml</code> when <code>site</code> is set.
      </p>

      <h2>Client navigation</h2>
      <Code
        code={`import { createRoutes, startRouter } from "jota-js";

const routes = createRoutes(import.meta.glob("/src/routes/**/*.tsx"));
startRouter(routes, document.getElementById("app")!);`}
      />
      <p>Same-origin links navigate without a page load; back and forward work.</p>

      <h2>Limits</h2>
      <ul>
        <li>Pages render synchronously: there is no async data loading yet.</li>
        <li>The inlined stylesheet is the whole file, not only the above-the-fold part.</li>
        <li>Images are not converted to WebP or AVIF yet.</li>
      </ul>
    </Layout>
  );
}
