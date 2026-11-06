/** The snippet shown when the playground opens. Kept apart from the compiler so the page stays small. */
export const EXAMPLE = `import { signal, render } from "jota-js";

function Counter() {
  const [count, setCount] = signal(0);
  return (
    <div>
      <p>Count: {count()}</p>
      <button type="button" onClick={() => setCount(count() + 1)}>
        Add one
      </button>
    </div>
  );
}

render(() => <Counter />, document.getElementById("app"));
`;
