import { signal, type JSXElement } from "jota-js";

export const config = { render: "client" } as const;
export const head = { title: "Interactive app" };

export default function App(): JSXElement {
  const [count, setCount] = signal(0);
  return (
    <main>
      <h1>Interactive</h1>
      <p>Count: {count()}</p>
      <button type="button" onClick={() => setCount(count() + 1)}>
        More
      </button>
    </main>
  );
}
