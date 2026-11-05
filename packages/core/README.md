# jota-js

Jota's runtime: fine-grained signals and the DOM runtime used by compiled JSX.

> **Status: pre-alpha.** The code in the repository works and is tested, but the version published on npm is still the `0.0.1` name placeholder. Use it from the repository until the first real release.

## Signals

```ts
import { signal, computed, effect, batch } from "jota-js";

const [count, setCount] = signal(0);
const double = computed(() => count() * 2);

effect(() => console.log(count(), double())); // logs 0 0, then again on every change

batch(() => {
  setCount(1);
  setCount(2); // effects run once, after the batch
});
```

| Function | What it does |
|---|---|
| `signal(initial)` | Returns `[get, set]`. `set` accepts a value or `(previous) => next`. |
| `computed(fn)` | Cached derived value; recomputes only when a source really changed. |
| `effect(fn)` | Runs now and when the signals it read change. Returns a dispose function. |
| `batch(fn)` | Groups writes so effects run once. |
| `untrack(fn)` | Reads signals without subscribing. |
| `createRoot(fn)` / `onCleanup(fn)` | Ownership scopes and cleanup. |

## Components

Components are plain functions that run **once**. Reactive values update only the DOM nodes that read them.

```tsx
import { signal, Show, For, render } from "jota-js";

function App() {
  const [items, setItems] = signal(["a", "b"]);
  return (
    <ul>
      <For each={items()}>{(item) => <li>{item}</li>}</For>
    </ul>
  );
}

render(() => <App />, document.getElementById("app")!);
```

Built in: `Show`, `For`, `mergeProps`, `splitProps`, `render`.

## TypeScript

Set `"jsx": "preserve"` and `"jsxImportSource": "jota-js"` in `tsconfig.json`. JSX intrinsic elements are typed loosely for now; stricter per-element types are planned.

Compile JSX with [`vite-plugin-jota`](../vite-plugin). `jota-js/web` is the runtime that compiled code imports; application code should not import it directly.

## License

MIT © JJBeta. JSX compilation uses `babel-plugin-jsx-dom-expressions` (MIT), the same compiler family as Solid.
