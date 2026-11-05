import type { JSXElement } from "jota-js";

export const head = { title: "Home | Test site", description: "The home page.", lang: "en" };

export default function Home(): JSXElement {
  return (
    <main>
      <h1>Welcome</h1>
      <img src="/hero.jpg" alt="Hero" width={800} height={400} />
      <img src="/second.jpg" alt="Second" width={400} height={200} />
      <a href="/about">About</a>
    </main>
  );
}
