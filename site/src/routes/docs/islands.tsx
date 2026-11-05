import type { JSXElement } from "jota-js";
import { Code, Layout } from "../../components/Layout";

export const head = {
  title: "Islands and build options | Jota",
  description: "Interactive islands inside static pages, AVIF and WebP images, and critical CSS.",
  lang: "en",
};

export default function Islands(): JSXElement {
  return (
    <Layout lang="en" path="/docs/islands">
      <h1>Islands and build options</h1>
      <p class="lead">Keep a page static and make only one part of it interactive.</p>

      <h2>Islands</h2>
      <p>
        An island is a component that is rendered to HTML at build time and mounted in the browser later: right away, when
        the browser is idle, or when it scrolls into view. The rest of the page stays plain HTML.
      </p>
      <Code
        code={`// src/routes/index.tsx  (a static page)
import { Island } from "jota-js";
import Newsletter from "../islands/Newsletter";

export default function Home() {
  return (
    <main>
      <h1>Hello</h1>
      <Island name="Newsletter" component={Newsletter} load="visible" />
    </main>
  );
}`}
      />
      <Code
        code={`// src/main.tsx  (the client entry)
import { startIslands } from "jota-js";

startIslands(import.meta.glob("/src/islands/*.tsx"));`}
      />
      <ul>
        <li>
          <code>load</code> is <code>"load"</code>, <code>"idle"</code> or <code>"visible"</code> (the default).
        </li>
        <li>
          Props are written into the HTML as JSON, so they must be serializable.
        </li>
        <li>
          The island file name in <code>src/islands</code> is its name. It needs a default export or an export with that name.
        </li>
        <li>
          A static page that contains an island keeps its script tag. Pages without islands still have none.
        </li>
        <li>
          The browser replaces the server HTML of the island with the live component; it does not hydrate it.
        </li>
      </ul>

      <h2>Images in AVIF and WebP</h2>
      <Code
        code={`// vite.config.ts
jotaStatic({ images: true })               // avif + webp, quality 70
jotaStatic({ images: { formats: ["webp"], quality: 80 } })`}
      />
      <p>
        The build converts local JPEG and PNG files with the optional package <code>sharp</code> and wraps each{" "}
        <code>&lt;img&gt;</code> in a <code>&lt;picture&gt;</code>, best format first. The original image stays as the
        fallback.
      </p>

      <h2>Critical CSS</h2>
      <p>
        Stylesheets up to 20 kB are inlined whole (<code>inlineCssLimit</code>). Above that limit the build inlines only the
        rules each page uses and loads the full file without blocking rendering, using{" "}
        <a href="https://github.com/danielroe/beasties">beasties</a>. Turn it off with <code>criticalCss: false</code>. The
        asynchronous load adds a small <code>onload</code> attribute to the stylesheet link and a{" "}
        <code>noscript</code> fallback.
      </p>

      <h2>Also automatic</h2>
      <ul>
        <li>
          The first image gets <code>fetchpriority="high"</code>; the others get <code>loading="lazy"</code>.
        </li>
        <li>
          <code>404.html</code> from <code>routes/404.tsx</code>, and <code>sitemap.xml</code> when <code>site</code> is set.
        </li>
      </ul>
    </Layout>
  );
}
