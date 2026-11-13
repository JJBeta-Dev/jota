# Decisión: renderizado en servidor por streaming

Estado: **no se implementa en 1.x.** Tomada el 2026-11-13.

## Qué es

Enviar el HTML al navegador por partes mientras los datos lentos terminan de cargar, en vez de esperar a tener la página completa.

## Por qué no ahora

1. **El producto es "cero JavaScript por defecto".** El camino principal de Jota es generar HTML estático en el build; ahí el streaming no aporta nada.
2. **`renderToString` es síncrono a propósito.** Instala el DOM, renderiza y lo retira en un solo tramo sin `await`, y así dos peticiones simultáneas no pueden verse entre sí (está explicado en `IA.md`). El streaming obliga a mantener el DOM instalado entre esperas y a aislar cada petición, lo que cambia ese diseño.
3. **Necesita piezas que aún no existen:** límites de suspensión en el compilador, un formato para enviar trozos fuera de orden y un script en el cliente que los coloque. Ese script va contra la promesa de páginas sin JavaScript.
4. **La medición actual no lo pide:** una página de 50 elementos se renderiza en 0,08 ms con el DOM ligero.

## Qué se hace en su lugar

- Cargar los datos antes de renderizar (`load` en las rutas, o en el servidor antes de `renderToString`).
- Para lo lento: una isla con `createResource`, que muestra un estado de carga y pide los datos desde el navegador.

## Cuándo se reabre

Si aparecen usuarios con páginas de servidor cuyo dato más lento retrasa toda la respuesta y una isla no les sirve. En ese caso el primer paso es un `renderToStream` que envíe la cabecera y el esqueleto de inmediato y el resto al final, sin trozos fuera de orden.
