# Plan para ganar con claridad (2026-11-13)

## Por qué las estadísticas actuales se quedan cortas

Lo medido hasta hoy es una tabla de 1.000 filas renderizada en el navegador. Esa prueba mide a Jota como si fuera una librería para aplicaciones de una sola página, que es el terreno de Solid, y deja sin medir casi todo lo que el proyecto construyó:

| Lo que Jota construyó | ¿Está medido contra otros? |
|---|---|
| Páginas de contenido sin JavaScript | No |
| Islas con hidratación | No |
| Reglas de accesibilidad que rompen el build (31) | No |
| Presupuesto de rendimiento que rompe el build | No (nadie más lo trae; hay que demostrarlo) |
| Markdown revisado en el build | No |
| Renderizado en servidor con DOM ligero | Solo contra sí mismo |
| Tiempo de build, memoria, arranque | No |
| Tabla en el navegador (SPA) | Sí: es lo único |

Conclusión: se midió el punto más débil y no los fuertes. El plan corrige eso primero.

## Principio

No se puede superar a todos en todo. Sí se puede ganar por mucho donde la ventaja viene del diseño y no de optimizar: un sitio que envía 0 kB de JavaScript no puede ser alcanzado por uno que envía 70 kB, por más que este se optimice. El plan concentra el esfuerzo ahí y lleva la velocidad en SPA a "tan rápido como Solid", sin prometer más.

## Fase 1: medir lo que importa (primero, porque decide el resto)

Un mismo sitio de contenido (inicio, blog de 20 artículos en Markdown, una página con un formulario interactivo) construido con Jota, Astro, Next.js, Nuxt, SvelteKit, SolidStart y Angular, con un solo comando que produzca la tabla. Medidas:

1. **JavaScript enviado por página** (gzip), en la página de contenido y en la interactiva.
2. **Lighthouse móvil** (rendimiento, TBT, LCP) con la misma configuración de red.
3. **Tiempo de build** y **peso total del sitio generado**.
4. **Tiempo hasta que el formulario responde** (hidratación de la isla).
5. **Accesibilidad detectada:** un conjunto de 40 a 50 errores plantados (uno por criterio WCAG) pasado por Jota Guard, eslint-plugin-jsx-a11y, las reglas de Svelte, eslint-plugin-vuejs-accessibility y el linter de plantillas de Angular. Se cuenta cuántos detecta cada uno, cuántos falsos positivos da en código correcto y si su build falla por defecto.
6. **Servidor:** páginas por segundo de `renderToString` contra React, Vue, Solid y Svelte con la misma página.
7. **Memoria y arranque** de la tabla actual (heap tras crear 10.000 filas, tiempo hasta la primera interacción).

Resultado esperado, sin garantizarlo: Jota y Astro empatan en JavaScript de páginas de contenido (0 kB) y Jota gana en la página interactiva y en accesibilidad detectada por defecto. Si alguna medida sale en contra, se publica y pasa a la fase 2 o 3.

## Fase 2: ventajas que nadie puede igualar con una optimización

1. **Guard como el verificador más completo:** cubrir cada criterio WCAG 2.2 AA que se pueda comprobar de forma estática, con tabla pública regla → criterio, y superar en detección a los cuatro rivales en el conjunto de la fase 1. Cero falsos positivos en el conjunto de código correcto es condición, no meta.
2. **Verificación en tres capas** que los demás no integran: código (Guard), contenido (Markdown) y resultado (axe en tests, Lighthouse en CI). Empaquetarlo como un solo comando: `jota check`.
3. **Presupuesto por defecto:** que un proyecto nuevo ya nazca con límites y el build falle al pasarlos. Hoy es opcional.
4. **Informe de build:** al terminar, una tabla por página con JavaScript, CSS, imágenes y estado de accesibilidad. Es la prueba visible en cada proyecto.

## Fase 3: cerrar la brecha de velocidad (hasta empatar con Solid)

En orden de costo:

1. **Vaciar y reemplazar listas** (hoy 70 % más lento que Solid): atajo para cuando la lista queda vacía o cambia entera. Es poco código y está medido dónde duele.
2. **Crear filas** (20-30 % más lento): reducir objetos por signal y por efecto. Ya falló un intento; el siguiente es unir cada signal en un solo objeto en lugar de una tupla con dos cierres, lo que puede exigir una API alternativa.
3. **Delegación de eventos** en listas largas (un escuchador en el contenedor en lugar de uno por fila).
4. Criterio de salida: empatar con Solid dentro del ruido en las nueve operaciones, en tres corridas. Si tras estos pasos no se llega, se documenta el límite y se deja.

## Fase 4: validación externa

1. Enviar la entrada a js-framework-benchmark tras publicar la 1.2.0.
2. Publicar el comparativo de la fase 1 como repositorio aparte que cualquiera pueda ejecutar.
3. Pedir a dos o tres personas con lector de pantalla que prueben los componentes de `jota-js/ui`.

## Fase 5: adopción

Sin usuarios, ninguna cifra anterior importa. Publicar la 1.2.0, lanzar con el comparativo de la fase 1 como pieza central y conseguir de 5 a 10 proyectos reales. Sus problemas deciden el siguiente trabajo.

## Qué significa "ganar" al final del plan

| Eje | Meta medible |
|---|---|
| JavaScript en páginas de contenido | 0 kB, empate con Astro y por debajo del resto |
| JavaScript en páginas interactivas | El menor de los siete |
| Accesibilidad detectada | Más errores plantados que cualquier rival, sin falsos positivos, con build que falla por defecto |
| Lighthouse móvil | 100 en accesibilidad y SEO, 95+ en rendimiento, en el sitio comparativo |
| Velocidad en SPA | Empate con Solid dentro del ruido |
| Ecosistema y adopción | No se gana en este plazo; se mide con proyectos reales |

## Lo que este plan no promete

Superar a React o Vue en ecosistema, ni ser el más rápido en aplicaciones de una sola página. Quien necesite eso debe usar Solid o React; decirlo forma parte de la credibilidad del proyecto.
