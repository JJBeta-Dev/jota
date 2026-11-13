---
title: Datos, formularios y componentes accesibles
description: Datos asíncronos, estado anidado, traducciones, formularios accesibles, pestañas, diálogos y pruebas de accesibilidad.
order: 7
---

# Datos, formularios y componentes accesibles

Cada pieza es una entrada aparte de `jota-js`: solo se descarga lo que importas.

## Datos asíncronos

```tsx
import { createResource, invalidate } from "jota-js/resource";

const user = createResource(userId, (id, { signal }) => fetch(`/api/users/${id}`, { signal }).then((r) => r.json()), {
  cacheKey: (id) => `users/${id}`,
});

<Show when={!user.loading()} fallback={<p>Cargando</p>}>
  {user.data()?.name}
</Show>;
```

Vuelve a cargar cuando cambia `userId()`. Una respuesta lenta nunca reemplaza a una más nueva. Los recursos con la misma `cacheKey` comparten una sola petición, e `invalidate("users/")` los recarga.

## Estado anidado

```ts
import { createStore } from "jota-js/store";

const [store, setStore] = createStore({ todos: [{ title: "Escribir docs", done: false }] });
setStore((draft) => {
  draft.todos[0].done = true;
});
```

Leer `store.todos[0].done` suscribe solo a esa propiedad.

## Traducciones

```ts
import { createI18n } from "jota-js/i18n";

const { t, setLocale } = createI18n({
  locale: "es",
  messages: {
    es: { items: { one: "{count} elemento", other: "{count} elementos" } },
    en: { items: { one: "{count} item", other: "{count} items" } },
  },
});
t("items", { count: 3 });
```

TypeScript revisa las claves. Los plurales usan `Intl.PluralRules` del navegador.

## Formularios

```tsx
import { createForm } from "jota-js/form";

const form = createForm({
  initial: { email: "" },
  validate: { email: (value) => (value.includes("@") ? undefined : "Escribe un correo.") },
  onSubmit: (values) => save(values),
});

<form onSubmit={form.submit} noValidate>
  <label for="field-email">Correo</label>
  <input type="email" {...form.field("email")} />
  <p {...form.errorProps("email")}>{form.error("email")}</p>
</form>;
```

El campo recibe `aria-invalid` y `aria-describedby`, el mensaje se anuncia y, si el envío falla, el foco va al primer campo con error.

## Pestañas, diálogo y disclosure

```tsx
import { createDialog, createTabs } from "jota-js/ui";

const tabs = createTabs({ tabs: ["codigo", "vista"] as const });
<div {...tabs.list} aria-label="Vista">
  <button {...tabs.tab("codigo")}>Código</button>
  <button {...tabs.tab("vista")}>Vista previa</button>
</div>;
<div {...tabs.panel("codigo")}>...</div>;

const dialog = createDialog();
<dialog {...dialog.dialog}>
  <h2 {...dialog.title}>¿Borrar el archivo?</h2>
</dialog>;
```

No traen estilos ni marcado propio. Las pestañas responden a las flechas, Inicio y Fin. El diálogo usa el `<dialog>` nativo: el navegador atrapa el foco y cierra con Escape.

## Pruebas de accesibilidad

```tsx
import { cleanup, expectAccessible, render } from "jota-js/testing";

afterEach(cleanup);

it("es accesible al renderizar", async () => {
  const { container } = render(() => <Newsletter />);
  await expectAccessible(container);
});
```

Jota Guard lee tu código. `expectAccessible` audita el resultado ya renderizado con axe-core (`npm install -D axe-core`).
