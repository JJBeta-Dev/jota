[English](README.md) · [Español](README.es.md)

# jota-js

El runtime de Jota: signals de grano fino, rutas por archivos y el runtime del DOM que usa el JSX compilado.

> **Estado: pre-alpha.** El código del repositorio funciona y tiene pruebas, pero la versión publicada en npm sigue siendo el marcador `0.0.1`. Úsalo desde el repositorio hasta el primer lanzamiento real.

## Signals

```ts
import { signal, computed, effect, batch } from "jota-js";

const [count, setCount] = signal(0);
const double = computed(() => count() * 2);

effect(() => console.log(count(), double())); // escribe 0 0 y de nuevo en cada cambio

batch(() => {
  setCount(1);
  setCount(2); // los efectos corren una vez, al final del lote
});
```

| Función | Qué hace |
|---|---|
| `signal(inicial)` | Devuelve `[get, set]`. `set` acepta un valor o `(anterior) => siguiente`. |
| `computed(fn)` | Valor derivado en caché; se recalcula solo si una fuente cambió de verdad. |
| `effect(fn)` | Corre ahora y cuando cambian los signals que leyó. Devuelve una función para detenerlo. |
| `batch(fn)` | Agrupa escrituras para que los efectos corran una vez. |
| `untrack(fn)` | Lee signals sin suscribirse. |
| `createRoot(fn)` / `onCleanup(fn)` | Ámbitos de propiedad y limpieza. |

## Componentes

Los componentes son funciones normales que se ejecutan **una sola vez**. Los valores reactivos actualizan solo los nodos del DOM que los leen.

```tsx
import { signal, For, render } from "jota-js";

function App() {
  const [items] = signal(["a", "b"]);
  return (
    <ul>
      <For each={items()}>{(item) => <li>{item}</li>}</For>
    </ul>
  );
}

render(() => <App />, document.getElementById("app")!);
```

Incluidos: `Show`, `For`, `mergeProps`, `splitProps`, `render`.

## Rutas

Los archivos de `src/routes` son páginas (`index.tsx` → `/`, `blog/[slug].tsx` → `/blog/:slug`, `[...rest].tsx` → comodín). Los archivos y carpetas que empiezan con `_` se ignoran.

```ts
import { createRoutes, startRouter } from "jota-js";

const routes = createRoutes(import.meta.glob("/src/routes/**/*.tsx"));
startRouter(routes, document.getElementById("app")!); // navegación sin recargar la página
```

Una ruta también puede exportar `load` (datos asíncronos, que llegan al componente como `props.data`) y `head`. `startRouter` espera a `load` antes de mostrar la página y acepta las opciones `notFound` y `onError`. Reemplaza el HTML pre-renderizado del elemento cuando la primera vista del cliente está lista, y solo toma los clics en enlaces que coinciden con una ruta de cliente; cualquier otro enlace es una navegación normal del navegador.

## Islas

```tsx
import { Island, startIslands } from "jota-js";

// en una página: <Island name="Counter" component={Counter} props={{ start: 1 }} load="visible" />
// en la entrada del cliente:
startIslands(import.meta.glob("/src/islands/*.tsx"));
```

Una isla se renderiza a HTML al compilar y el navegador la monta cuando carga, cuando está inactivo o cuando se vuelve visible. `startIslands` devuelve cuántas islas encontró. La isla hidrata su HTML del servidor: se conservan los elementos y solo se conecta el comportamiento. Si el HTML no coincide con lo que construye el componente, la isla se monta desde cero.

Para generar páginas estáticas sin JavaScript usa `vite-plugin-jota/static` (ver [vite-plugin-jota](../vite-plugin/README.es.md)).

## Render en servidor

`jota-js/server` renderiza un componente a una cadena de HTML en Node, en cada petición. Jota construye nodos DOM reales, así que necesita un DOM: por defecto uno pequeño que viene con Jota (nada que instalar), que implementa lo que usan el runtime y los componentes típicos (elementos, texto, comentarios, atributos, clases, estilos, clonado, lectura y escritura de HTML). Si un componente necesita más APIs del navegador, pasa `dom: "happy-dom"` para un DOM completo (dependencia opcional: `npm install happy-dom`). El DOM existe solo mientras el componente se renderiza, y el render es síncrono, así que las peticiones simultáneas no se mezclan. Carga los datos primero y luego renderiza:

```tsx
import { renderToString } from "jota-js/server";

const data = await loadPosts();
const app = await renderToString(() => <Page data={data} />);
response.end(shell.replace("<!--app-->", app));
```

El HTML lleva las marcas que el navegador necesita para hidratarlo (`hydrate: "page"` por defecto; `"islands"` o `false` lo cambian). En el navegador, `hydrate(() => <Page data={data} />, element)` conserva esos elementos y les conecta el comportamiento, y devuelve `null` si el HTML no coincide, para que puedas volver a `render`. Un servidor y un cliente completos están en [`examples/server`](https://github.com/JJBeta-Dev/jota/tree/main/examples/server). Medido en una máquina con una página de 50 elementos de lista: unos 12.000 renders por segundo por núcleo con el DOM por defecto, unos 1.000 con `dom: "happy-dom"`. No incluye: streaming, ni render que espere datos dentro de los componentes (cárgalos antes).

## Datos, estado, traducciones y formularios

Cada pieza es una entrada aparte: solo se descarga lo que importas.

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

- **`createResource`**: datos asíncronos como signals (`data`, `loading`, `error`, `refetch`, `mutate`). Vuelve a cargar cuando cambia su fuente, una respuesta lenta nunca pisa a una más nueva, y los recursos con la misma `cacheKey` comparten una sola petición y un solo valor guardado. `invalidate(prefijo)` los recarga.
- **`createStore`**: estado anidado. Leer `store.todos[0].done` suscribe solo a esa propiedad; se escribe dentro de `setStore`.
- **`createI18n`**: traducciones con `{parámetros}` y plurales de `Intl.PluralRules`, además de `number` y `date`. TypeScript revisa las claves.
- **`createForm`**: validación accesible por defecto. Cada control recibe `aria-invalid` y `aria-describedby` apuntando a su mensaje, el mensaje se anuncia y un envío fallido lleva el foco al primer campo con error.
- **`defineCollection`**: entradas tipadas a partir de una carpeta de archivos Markdown; un campo ausente o de tipo incorrecto detiene el build y nombra el archivo.

## Pruebas

`jota-js/testing` renderiza un componente para una prueba y audita el resultado con [axe-core](https://github.com/dequelabs/axe-core) (`npm install -D axe-core`).

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

Jota Guard lee tu código; `expectAccessible` lee el DOM ya renderizado, así que también detecta problemas que solo existen al ejecutar. `checkAccessibility(element)` devuelve la lista en vez de fallar. El contraste de color viene desactivado porque el DOM de pruebas no calcula el diseño de la página.

## TypeScript

Pon `"jsx": "preserve"` y `"jsxImportSource": "jota-js"` en `tsconfig.json`. Todos los elementos HTML estándar y los SVG comunes están tipados: atributos, `class`/`classList`/`style`, `ref` y manejadores de eventos con `currentTarget` tipado. Los atributos `data-*` y `aria-*` siempre se permiten y los elementos con guion en el nombre (elementos personalizados) aceptan cualquier atributo.

## Licencia

MIT © JJBeta. La compilación de JSX usa `babel-plugin-jsx-dom-expressions` (MIT), de la misma familia de compiladores que Solid.
