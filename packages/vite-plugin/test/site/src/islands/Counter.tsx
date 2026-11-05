import { signal, type JSXElement } from "jota-js";

export default function Counter(props: { start: number }): JSXElement {
  const [count, setCount] = signal(props.start);
  return (
    <button type="button" onClick={() => setCount(count() + 1)}>
      Count: {count()}
    </button>
  );
}
