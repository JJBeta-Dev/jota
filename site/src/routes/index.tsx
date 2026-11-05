import type { JSXElement } from "jota-js";
import { Code, Layout } from "../components/Layout";

export const head = {
  title: "Jota: a frontend toolkit with accessibility guardrails",
  description:
    "Fine-grained reactivity without a Virtual DOM, plain TSX, and checks that fail the build when a page is not accessible.",
  lang: "en",
};

export default function Home(): JSXElement {
  return (
    <Layout lang="en" path="/">
      <p>
        <span class="badge">Pre-alpha</span>
      </p>
      <h1>
        Frontend that <span class="accent">checks itself</span>
      </h1>
      <p class="lead">
        Write plain TSX. Components run once, only the exact DOM node that depends on a value updates, and the build fails
        when a page is not accessible.
      </p>
      <div class="actions">
        <a class="button" href="/docs/getting-started">
          Get started
        </a>
        <a class="button secondary" href="/docs/guard">
          See the Guard rules
        </a>
      </div>

      <div class="cards">
        <section class="card">
          <h2>No re-renders</h2>
          <p>
            Signals update the exact text node or attribute that reads them. There is no Virtual DOM and no{" "}
            <code>useMemo</code>.
          </p>
        </section>
        <section class="card">
          <h2>Guardrails</h2>
          <p>
            Jota Guard fails the build on a <code>div</code> with <code>onClick</code>, an image without <code>alt</code>, or
            an input without a label.
          </p>
        </section>
        <section class="card">
          <h2>Pages without JavaScript</h2>
          <p>Routes become static HTML by default. Only the routes you mark as interactive load JavaScript.</p>
        </section>
      </div>

      <h2>A counter</h2>
      <Code
        code={`import { signal, render } from "jota-js";

function Counter() {
  const [count, setCount] = signal(0);
  return (
    <button type="button" onClick={() => setCount(count() + 1)}>
      Clicks: {count()}
    </button>
  );
}

render(() => <Counter />, document.getElementById("app")!);`}
      />
      <p>
        <code>Counter</code> runs once. Each click changes one text node.
      </p>

      <h2>Honest status</h2>
      <p class="note">
        Jota is pre-alpha. The runtime, compiler, router, static generation and Guard work and are tested, but nothing has had
        a real release yet and there are no browser benchmarks against other frameworks. It is built in the open at{" "}
        <a href="https://github.com/JJBeta-Dev/jota">github.com/JJBeta-Dev/jota</a>.
      </p>
    </Layout>
  );
}
