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

Una ruta también puede exportar `load` (datos asíncronos, que llegan al componente como `props.data`) y `head`. `startRouter` espera a `load` antes de mostrar la página y acepta las opciones `notFound` y `onError`.

## Islas

```tsx
import { Island, startIslands } from "jota-js";

// en una página: <Island name="Counter" component={Counter} props={{ start: 1 }} load="visible" />
// en la entrada del cliente:
startIslands(import.meta.glob("/src/islands/*.tsx"));
```

Una isla se renderiza a HTML al compilar y el navegador la monta cuando carga, cuando está inactivo o cuando se vuelve visible. `startIslands` devuelve cuántas islas encontró. La isla reemplaza su HTML del servidor; no lo hidrata.

Para generar páginas estáticas sin JavaScript usa `vite-plugin-jota/static` (ver [vite-plugin-jota](../vite-plugin/README.es.md)).

## TypeScript

Pon `"jsx": "preserve"` y `"jsxImportSource": "jota-js"` en `tsconfig.json`. Todos los elementos HTML estándar y los SVG comunes están tipados: atributos, `class`/`classList`/`style`, `ref` y manejadores de eventos con `currentTarget` tipado. Los atributos `data-*` y `aria-*` siempre se permiten y los elementos con guion en el nombre (elementos personalizados) aceptan cualquier atributo.

## Licencia

MIT © JJBeta. La compilación de JSX usa `babel-plugin-jsx-dom-expressions` (MIT), de la misma familia de compiladores que Solid.
