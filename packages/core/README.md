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

A route can also export `load` (async data, passed to the component as `props.data`) and `head`. `startRouter` awaits `load` before showing the page and accepts `notFound` and `onError` options. It replaces any pre-rendered HTML in the element when the first client view is ready, and only takes over clicks on links that match a client route; every other link is a normal browser navigation.

## Islands

```tsx
import { Island, startIslands } from "jota-js";

// in a page: <Island name="Counter" component={Counter} props={{ start: 1 }} load="visible" />
// in the client entry:
startIslands(import.meta.glob("/src/islands/*.tsx"));
```

An island is rendered to HTML at build time and mounted in the browser when it loads, when the browser is idle, or when it becomes visible. `startIslands` returns how many islands it found. The island hydrates its server HTML: the elements are kept and only behaviour is attached. If the HTML does not match what the component builds, the island is mounted from scratch.

For static pages with no JavaScript use `vite-plugin-jota/static` (see [vite-plugin-jota](../vite-plugin)).

## Server rendering

`jota-js/server` renders a component to an HTML string in Node, on every request. Jota builds real DOM nodes, so it needs a DOM: by default a small one that ships with Jota (nothing to install), which implements what the runtime and typical components use (elements, text, comments, attributes, classes, styles, cloning, parsing and serializing HTML). If a component needs more browser APIs, pass `dom: "happy-dom"` for a full DOM (optional dependency: `npm install happy-dom`). The DOM exists only while the component renders, and rendering is synchronous, so simultaneous requests do not mix. Load the data first, then render:

```tsx
import { renderToString } from "jota-js/server";

const data = await loadPosts();
const app = await renderToString(() => <Page data={data} />);
response.end(shell.replace("<!--app-->", app));
```

The HTML carries the marks the browser needs to hydrate it (`hydrate: "page"` by default; `"islands"` or `false` change that). In the browser, `hydrate(() => <Page data={data} />, element)` keeps those elements and attaches behaviour, and returns `null` if the HTML does not match, so you can fall back to `render`. A complete server and client are in [`examples/server`](https://github.com/JJBeta-Dev/jota/tree/main/examples/server). Measured on one machine with a page of 50 list items: about 12,000 renders per second per core with the default DOM, about 1,000 with `dom: "happy-dom"`. Not included: streaming, and rendering that waits for data inside components (load it before).

## Data, state, translations and forms

Each one is a separate entry, so you only ship what you import.

```tsx
import { createResource, invalidate } from "jota-js/resource";
import { createStore } from "jota-js/store";
import { createI18n } from "jota-js/i18n";
import { createForm } from "jota-js/form";
import { defineCollection } from "jota-js/content";

const user = createResource(userId, (id, { signal }) => fetch(`/api/users/${id}`, { signal }).then((r) => r.json()), {
  cacheKey: (id) => `users/${id}`,
});
<Show when={!user.loading()} fallback={<p>Loading</p>}>{user.data()?.name}</Show>;
invalidate("users/");

const [store, setStore] = createStore({ todos: [{ title: "Write docs", done: false }] });
setStore((draft) => { draft.todos[0].done = true; });

const { t, setLocale } = createI18n({
  locale: "en",
  messages: {
    en: { items: { one: "{count} item", other: "{count} items" } },
    es: { items: { one: "{count} elemento", other: "{count} elementos" } },
  },
});
t("items", { count: 3 });

const form = createForm({
  initial: { email: "" },
  validate: { email: (value) => (value.includes("@") ? undefined : "Enter an email address.") },
  onSubmit: (values) => save(values),
});
<form onSubmit={form.submit} noValidate>
  <label for="field-email">Email</label>
  <input type="email" {...form.field("email")} />
  <p {...form.errorProps("email")}>{form.error("email")}</p>
</form>;

const posts = defineCollection(import.meta.glob("./posts/*.md", { eager: true }), { title: "string", date: "string", draft: "boolean?" });
```

- **`createResource`**: async data as signals (`data`, `loading`, `error`, `refetch`, `mutate`). It loads again when its source changes, a slow answer never overwrites a newer one, and resources with the same `cacheKey` share one request and one stored value. `invalidate(prefix)` reloads them.
- **`createStore`**: nested state. Reading `store.todos[0].done` subscribes to that property only; writes happen inside `setStore`.
- **`createI18n`**: translations with `{placeholders}` and plurals from `Intl.PluralRules`, plus `number` and `date`. TypeScript checks the keys.
- **`createForm`**: validation that is accessible by default. Each control gets `aria-invalid` and `aria-describedby` pointing at its message, the message is announced, and a failed submit moves focus to the first invalid field.
- **`defineCollection`**: typed entries from a folder of Markdown files; a missing or mistyped front matter field stops the build and names the file.

## Testing

`jota-js/testing` renders a component for a test and audits the result with [axe-core](https://github.com/dequelabs/axe-core) (`npm install -D axe-core`).

```tsx
import { afterEach, expect, it } from "vitest";
import { cleanup, expectAccessible, render } from "jota-js/testing";
import { Newsletter } from "./Newsletter";

afterEach(cleanup);

it("is accessible once rendered", async () => {
  const { container } = render(() => <Newsletter />);
  await expectAccessible(container);
});
```

Jota Guard reads your source; `expectAccessible` reads the rendered DOM, so it also catches problems that only exist at run time. `checkAccessibility(element)` returns the list instead of failing. Color contrast is off by default because test DOMs do not lay out pages.

## TypeScript

Set `"jsx": "preserve"` and `"jsxImportSource": "jota-js"` in `tsconfig.json`. Every standard HTML element and the common SVG elements are typed: attributes, `class`/`classList`/`style`, `ref`, and event handlers with a typed `currentTarget`. `data-*` and `aria-*` attributes are always allowed, and elements with a hyphen in the name (custom elements) accept any attribute.

Compile JSX with [`vite-plugin-jota`](../vite-plugin). `jota-js/web` is the runtime that compiled code imports; application code should not import it directly.

## License

MIT © JJBeta. JSX compilation uses `babel-plugin-jsx-dom-expressions` (MIT), the same compiler family as Solid.
