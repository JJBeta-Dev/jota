import { signal, type JSXElement } from "jota-js";

export const calls = { counter: 0 };

export function Counter(props: { label: string }): JSXElement {
  calls.counter++;
  const [count, setCount] = signal(0);

  return (
    <section>
      <h2>{props.label}</h2>
      <p>Clicks: {count()}</p>
      <button type="button" onClick={() => setCount(count() + 1)}>
        Add one
      </button>
    </section>
  );
}
