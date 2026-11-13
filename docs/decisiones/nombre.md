# Decisión pendiente: ¿mantener el nombre "Jota"?

Estado: **recomendación lista, decide el dueño.** Datos tomados el 2026-11-13.

## El problema

- Existe **Jotai**, una librería de estado para React con 9,6 millones de descargas semanales en npm (dato de `api.npmjs.org`, semana del 6 al 12 de noviembre de 2026).
- "Jota" y "Jotai" difieren en una letra. Quien busque "jota js", "jota signals" o "jota state" va a ver primero resultados de Jotai.
- El nombre `jota` en GitHub y `jota` en npm no son nuestros; por eso el paquete se llama `jota-js`.

## Opciones

| Opción | A favor | En contra |
|---|---|---|
| **A. Mantener "Jota"** | Ya publicado (4 paquetes), logo "Thread j" aprobado, marca personal (JJBeta), corto y fácil de decir | Confusión permanente con Jotai en buscadores y en conversación; `jota` a secas no está disponible |
| **B. Renombrar ahora** | Nombre propio en buscadores; se hace antes de tener usuarios (0 estrellas hoy), que es el momento más barato | Republicar 4 paquetes, redirigir el repositorio, rehacer textos; se pierde el vínculo directo con "JJBeta" |
| **C. Mantener "Jota" con apellido** ("Jota Framework", `jota-js`, dominio propio) | Sin costo técnico | No resuelve la confusión al hablar ni al buscar |

## Nombres alternativos, comprobados como libres en npm el 2026-11-13

Todos conservan la idea del logo (una j cosida con hilo):

| Nombre | Significado | npm |
|---|---|---|
| `hebra` | Hebra de hilo | libre (`hebra` y `hebra-js`) |
| `puntada` | Puntada de costura | libre (`puntada` y `puntada-js`) |
| `trazo` | Trazo, línea | libre (`trazo` y `trazo-js`) |

No están libres o no convienen: `hilo` (ocupado en npm). Falta comprobar cada uno en GitHub y como marca antes de elegir.

## Recomendación

**Opción A hasta medir, con fecha límite.** El renombrado solo vale la pena si el proyecto consigue usuarios, y hoy no los tiene; pero el costo de renombrar crece con cada usuario. Propuesta concreta:

1. Lanzar como "Jota" con el mensaje del build que falla (ese mensaje, y no el nombre, es lo que se recuerda).
2. A las 4 semanas del lanzamiento, revisar: si en los comentarios aparece la confusión con Jotai más de un par de veces, renombrar a `hebra` antes de la versión 2.0, dejando los paquetes viejos como alias con aviso.
3. Si no aparece, cerrar esta decisión y congelar el nombre.

Mientras tanto, reservar `hebra` en npm cuesta cinco minutos y evita perderlo.
