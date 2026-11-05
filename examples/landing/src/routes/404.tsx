import type { JSXElement } from "jota-js";

export const head = { title: "Page not found | Jota landing", description: "This page does not exist.", lang: "en" };

export default function NotFound(): JSXElement {
  return (
    <main>
      <h1>Page not found</h1>
      <p>
        <a href="/">Back to the landing page</a>
      </p>
    </main>
  );
}
