import type { JSXElement } from "jota-js";
import { Layout } from "../components/Layout";

export const head = { title: "Page not found | Jota", description: "This page does not exist.", lang: "en" };

export default function NotFound(): JSXElement {
  return (
    <Layout lang="en" path="/404">
      <h1>Page not found</h1>
      <p class="lead">That page does not exist. Try the home page or the getting started guide.</p>
      <div class="actions">
        <a class="button" href="/">
          Home
        </a>
        <a class="button secondary" href="/docs/getting-started">
          Getting started
        </a>
      </div>
    </Layout>
  );
}
