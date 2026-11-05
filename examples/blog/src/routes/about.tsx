import type { JSXElement } from "jota-js";
import { Shell } from "../components/Shell";

export const head = { title: "About | Jota blog", description: "About this example blog.", lang: "en" };

export default function About(): JSXElement {
  return (
    <Shell>
      <h1>About</h1>
      <p>
        This blog is an example of a Jota static site: file-based routes, a dynamic route with <code>paths</code>, async
        data with <code>load</code>, and no JavaScript in the pages.
      </p>
    </Shell>
  );
}
