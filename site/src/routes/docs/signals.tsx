import type { JSXElement } from "jota-js";
import { Code, Layout } from "../../components/Layout";

export const head = {
  title: "Signals | Jota",
  description: "signal, computed, effect, batch and the built-in components of Jota.",
  lang: "en",
};

const API: Array<[string, string]> = [
  ["signal(initial)", "Returns [get, set]. set takes a value or (previous) => next."],
  ["computed(fn)", "Cached derived value. Recomputes only when a source it read really changed."],
  ["effect(fn)", "Runs now and whenever the signals it read change. Returns a dispose function."],
  ["batch(fn)", "Groups several writes so effects run once at the end."],
  ["untrack(fn)", "Reads signals without subscribing the current effect."],
  ["createRoot(fn) / onCleanup(fn)", "Ownership scopes and cleanup when an effect re-runs or is disposed."],
  ["Show", "Renders children while `when` is truthy, otherwise `fallback`."],
  ["For", "Renders a list, reusing the DOM of items that stay in the list."],
  ["mergeProps / splitProps", "Combine or split props objects without losing reactivity."],
];

export default function Signals(): JSXElement {
  return (
    <Layout lang="en" path="/docs/signals">
      <h1>Signals</h1>
      <p class="lead">Reactive values that know who reads them, so only that part of the page updates.</p>

      <Code
        code={`import { signal, computed, effect, batch } from "jota-js";

const [count, setCount] = signal(0);
const double = computed(() => count() * 2);

effect(() => console.log(count(), double())); // 0 0, then again on every change

batch(() => {
  setCount(1);
  setCount(2); // effects run once, after the batch
});`}
      />

      <h2>API</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">What it does</th>
          </tr>
        </thead>
        <tbody>
          {API.map(([name, text]) => (
            <tr>
              <td>
                <code>{name}</code>
              </td>
              <td>{text}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Components run once</h2>
      <p>
        A component is a plain function called one time. The compiler turns each <code>{"{expression}"}</code> into a small
        effect on the node that uses it. That is why a click changes one text node and nothing else.
      </p>
      <Code
        code={`<Show when={user()} fallback={<p>Signed out</p>}>
  <p>Hello {user()}</p>
</Show>

<ul>
  <For each={items()}>{(item) => <li>{item}</li>}</For>
</ul>`}
      />

      <h2>Known limits</h2>
      <ul>
        <li>JSX element types are loose for now: any tag accepts any props.</li>
        <li>There is no hydration: client routes mount again instead of resuming server HTML.</li>
      </ul>
    </Layout>
  );
}
