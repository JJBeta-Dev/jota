import type { JSXElement } from "jota-js";
import { Shell } from "../components/Shell";

export const head = { title: "Page not found | Jota blog", description: "This page does not exist.", lang: "en" };

export default function NotFound(): JSXElement {
  return (
    <Shell>
      <h1>Page not found</h1>
      <p>
        <a href="/">Go back to the blog</a>
      </p>
    </Shell>
  );
}
