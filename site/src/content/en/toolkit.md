---
title: Data, forms and accessible widgets
description: Async data, nested state, translations, accessible forms, tabs and dialogs, and accessibility tests.
order: 7
---

# Data, forms and accessible widgets

Each piece is a separate entry of `jota-js`. You only ship what you import.

## Async data

```tsx
import { createResource, invalidate } from "jota-js/resource";

const user = createResource(userId, (id, { signal }) => fetch(`/api/users/${id}`, { signal }).then((r) => r.json()), {
  cacheKey: (id) => `users/${id}`,
});

<Show when={!user.loading()} fallback={<p>Loading</p>}>
  {user.data()?.name}
</Show>;
```

It loads again when `userId()` changes. A slow answer never replaces a newer one. Resources with the same `cacheKey` share one request. `invalidate("users/")` reloads them.

## Nested state

```ts
import { createStore } from "jota-js/store";

const [store, setStore] = createStore({ todos: [{ title: "Write docs", done: false }] });
setStore((draft) => {
  draft.todos[0].done = true;
});
```

Reading `store.todos[0].done` subscribes to that property only.

## Translations

```ts
import { createI18n } from "jota-js/i18n";

const { t, setLocale } = createI18n({
  locale: "en",
  messages: {
    en: { items: { one: "{count} item", other: "{count} items" } },
    es: { items: { one: "{count} elemento", other: "{count} elementos" } },
  },
});
t("items", { count: 3 });
```

TypeScript checks the keys. Plurals use the browser's `Intl.PluralRules`.

## Forms

```tsx
import { createForm } from "jota-js/form";

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
```

The control gets `aria-invalid` and `aria-describedby`, the message is announced, and a failed submit moves focus to the first invalid field.

## Tabs, dialog and disclosure

```tsx
import { createDialog, createTabs } from "jota-js/ui";

const tabs = createTabs({ tabs: ["code", "preview"] as const });
<div {...tabs.list} aria-label="View">
  <button {...tabs.tab("code")}>Code</button>
  <button {...tabs.tab("preview")}>Preview</button>
</div>;
<div {...tabs.panel("code")}>...</div>;

const dialog = createDialog();
<dialog {...dialog.dialog}>
  <h2 {...dialog.title}>Delete the file?</h2>
</dialog>;
```

No styles and no markup of their own. Tabs handle arrow keys, Home and End. The dialog uses the native `<dialog>`, so the browser traps focus and closes on Escape.

## Accessibility tests

```tsx
import { cleanup, expectAccessible, render } from "jota-js/testing";

afterEach(cleanup);

it("is accessible once rendered", async () => {
  const { container } = render(() => <Newsletter />);
  await expectAccessible(container);
});
```

Jota Guard reads your source. `expectAccessible` audits the rendered result with axe-core (`npm install -D axe-core`).
