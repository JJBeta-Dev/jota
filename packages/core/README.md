[English](README.md) · [Español](README.es.md)

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

## Routing

Files in `src/routes` are pages (`index.tsx` -> `/`, `blog/[slug].tsx` -> `/blog/:slug`, `[...rest].tsx` -> catch-all). Files and folders starting with `_` are ignored.

```ts
import { createRoutes, startRouter } from "jota-js";

const routes = createRoutes(import.meta.glob("/src/routes/**/*.tsx"));
startRouter(routes, document.getElementById("app")!); // client navigation without page loads
```

A route can also export `load` (async data, passed to the component as `props.data`) and `head`. `startRouter` awaits `load` before showing the page and accepts `notFound` and `onError` options.

## Islands

```tsx
import { Island, startIslands } from "jota-js";

// in a page: <Island name="Counter" component={Counter} props={{ start: 1 }} load="visible" />
// in the client entry:
startIslands(import.meta.glob("/src/islands/*.tsx"));
```

An island is rendered to HTML at build time and mounted in the browser when it loads, when the browser is idle, or when it becomes visible. `startIslands` returns how many islands it found. The island replaces its server HTML; it does not hydrate it.

For static pages with no JavaScript use `vite-plugin-jota/static` (see [vite-plugin-jota](../vite-plugin)).

## TypeScript

Set `"jsx": "preserve"` and `"jsxImportSource": "jota-js"` in `tsconfig.json`. Every standard HTML element and the common SVG elements are typed: attributes, `class`/`classList`/`style`, `ref`, and event handlers with a typed `currentTarget`. `data-*` and `aria-*` attributes are always allowed, and elements with a hyphen in the name (custom elements) accept any attribute.

Compile JSX with [`vite-plugin-jota`](../vite-plugin). `jota-js/web` is the runtime that compiled code imports; application code should not import it directly.

## License

MIT © JJBeta. JSX compilation uses `babel-plugin-jsx-dom-expressions` (MIT), the same compiler family as Solid.
