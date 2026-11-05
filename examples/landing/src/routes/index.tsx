import { Island, type JSXElement } from "jota-js";
import Newsletter from "../islands/Newsletter";

export const head = {
  title: "Jota landing | Pages that ship almost no JavaScript",
  description: "A landing page built with Jota: static HTML with one interactive island.",
  lang: "en",
};

export default function Landing(): JSXElement {
  return (
    <>
      <header>
        <nav aria-label="Main">
          <a href="#features">Features</a>
          <a href="#subscribe">Subscribe</a>
        </nav>
      </header>
      <main>
        <h1>
          Pages that ship <em>almost nothing</em>
        </h1>
        <p class="muted">
          This page is static HTML. Only the newsletter form below is interactive, so only that part loads JavaScript.
        </p>

        <section id="features" aria-labelledby="features-title">
          <h2 id="features-title">Why it is light</h2>
          <div class="card">
            <h3>Static first</h3>
            <p>Routes become HTML at build time. Nothing runs in the browser unless you ask it to.</p>
          </div>
          <div class="card">
            <h3>Islands</h3>
            <p>Interactive parts are mounted when they load, when the browser is idle, or when they scroll into view.</p>
          </div>
        </section>

        <section id="subscribe" aria-labelledby="subscribe-title" class="card">
          <h2 id="subscribe-title">Stay in the loop</h2>
          <Island name="Newsletter" component={Newsletter} load="visible" />
        </section>
      </main>
      <footer>
        <p class="muted">Built with Jota.</p>
      </footer>
    </>
  );
}
