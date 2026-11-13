---
title: Signals
description: El estado reactivo de Jota. Cambia un valor y solo se actualiza lo que lo usa.
order: 2
---

# Signals

Un signal guarda un valor. Lo que lee ese valor se actualiza cuando cambia, y nada más.

```tsx
import { signal, computed, effect } from "jota-js";

const [count, setCount] = signal(0);
const double = computed(() => count() * 2);

effect(() => console.log(double()));
setCount(1);
setCount((previous) => previous + 1);
```

- `signal(valor)` devuelve una función para leer y otra para escribir.
- `computed` calcula un valor a partir de otros y lo guarda hasta que cambien.
- `effect` ejecuta código cada vez que cambia algo que leyó.

## Los componentes se ejecutan una vez

```tsx
function Counter() {
  const [count, setCount] = signal(0);
  return (
    <button type="button" onClick={() => setCount(count() + 1)}>
      Clics: {count()}
    </button>
  );
}
```

La función `Counter` corre una sola vez. Al hacer clic solo cambia el texto del número: no hay DOM virtual ni se vuelve a ejecutar el componente.

## Listas y condiciones

```tsx
import { For, Show } from "jota-js";

<Show when={user()} fallback={<p>Sin sesión</p>}>
  <p>Hola</p>
</Show>;

<ul>
  <For each={items()}>{(item) => <li>{item.name}</li>}</For>
</ul>;
```

`For` reutiliza los elementos que ya existen cuando la lista cambia.

## Otras funciones

| Función | Para qué sirve |
|---|---|
| `batch(fn)` | Hacer varios cambios y actualizar una sola vez |
| `untrack(fn)` | Leer un signal sin suscribirse |
| `onCleanup(fn)` | Limpiar al desaparecer el componente o antes de repetir un efecto |
| `createRoot(fn)` | Crear un ámbito reactivo fuera de un componente |
