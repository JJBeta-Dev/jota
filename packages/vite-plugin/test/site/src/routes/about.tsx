import type { JSXElement } from "jota-js";

export const head = { title: "About" };

export default function About(): JSXElement {
  return (
    <main>
      <h1>About us</h1>
      <p>Static page, no JavaScript.</p>
    </main>
  );
}
