[English](README.md) · [Español](README.es.md)

# jota-guard

Comprobaciones de accesibilidad, semántica y rendimiento para archivos JSX y TSX. Funciona con React, Solid, Preact y Jota. Es un plugin de ESLint y una herramienta de línea de comandos.

> **Estado: pre-alpha.** El código del repositorio está listo, pero la versión publicada en npm sigue siendo el marcador `0.0.1` que reserva el nombre. Hasta el primer lanzamiento real, ejecútalo desde el repositorio.

Guard es análisis estático: detecta un subconjunto conocido de problemas y no puede prometer que una página sea totalmente accesible.

## Inicio rápido

```bash
npx jota-guard            # revisa todos los .tsx y .jsx de la carpeta actual
npx jota-guard src        # o carpetas y archivos concretos
```

Códigos de salida: `0` nada que corregir, `1` hay problemas, `2` error de uso.

## Opciones

| Opción | Significado |
|---|---|
| `--preset <nombre>` | `recommended` (por defecto), `strict` (las advertencias pasan a error) o `a11y-only` (apaga `img-size`) |
| `--rule <id>=<nivel>` | cambia una regla a `error`, `warn` u `off` (repetible), por ejemplo `--rule heading-order=error` |
| `--config <archivo>` | lee ajustes de un JSON (por defecto `jota.config.json` si existe) |
| `--format <nombre>` | `stylish` (por defecto) o `json` |
| `--max-warnings <n>` | falla si hay más de `n` advertencias |
| `--ignore <glob>` | glob extra a ignorar, repetible (`node_modules`, `dist`, `build` siempre se ignoran) |

## Severidad configurable

`heading-order` e `img-size` avisan por defecto, pero puedes hacerlas error:

```json
{
  "guard": {
    "preset": "recommended",
    "rules": { "heading-order": "error" },
    "ignore": ["**/generated/**"],
    "maxWarnings": 10
  }
}
```

Prioridad: opciones de la línea de comandos, luego el archivo de configuración, luego el preset.

## Reglas

| Regla | Por defecto | Revisa |
|---|---|---|
| `jota/img-alt` | error | `<img>` tiene `alt` (usa `alt=""` en imágenes decorativas) |
| `jota/img-size` | warn | `<img>` tiene `width` y `height` (evita saltos de diseño) |
| `jota/clickable-role` | error | sin `onClick` en elementos no interactivos sin rol, `tabIndex` y manejador de teclado |
| `jota/button-name` | error | los botones tienen nombre accesible |
| `jota/link-name` | error | los enlaces tienen nombre accesible y un `href` real |
| `jota/input-label` | error | inputs, selects y textareas tienen etiqueta |
| `jota/heading-order` | warn | sin saltos de nivel de encabezado, un solo `h1` |
| `jota/html-lang` | error | `<html>` tiene `lang` |
| `jota/no-positive-tabindex` | warn | sin `tabIndex` mayor que 0 |
| `jota/media-captions` | warn | `<video>` tiene pista de subtítulos |
| `jota/iframe-title` | error | `<iframe>` tiene título |
| `jota/aria-role-valid` | error | `role` es un rol ARIA real |
| `jota/aria-hidden-focusable` | error | sin `aria-hidden` en elementos que reciben foco |
| `jota/no-distracting-elements` | error | sin `<marquee>` ni `<blink>` |
| `jota/valid-lang` | error | `lang` parece una etiqueta de idioma |
| `jota/no-autofocus` | warn | sin `autoFocus` |
| `jota/no-access-key` | warn | sin `accessKey` |
| `jota/no-redundant-alt` | warn | sin "image" ni "photo" en `alt` |
| `jota/heading-has-content` | error | los encabezados no están vacíos |
| `jota/aria-props` | error | los atributos `aria-*` existen en ARIA |
| `jota/scope-valid` | error | `scope` solo en `<th>` |
| `jota/aria-unsupported-elements` | error | sin `role`/`aria-*` en `<meta>`, `<html>`, `<script>`, `<style>`... |
| `jota/mouse-events-have-key-events` | warn | `onMouseOver`/`onMouseOut` van con `onFocus`/`onBlur` |
| `jota/no-redundant-roles` | warn | sin un rol que el elemento ya tiene |
| `jota/no-noninteractive-tabindex` | warn | sin `tabIndex={0}` en contenido que no es interactivo |
| `jota/anchor-ambiguous-text` | warn | sin enlaces "click here" ni "read more" |

Cuando una regla no puede estar segura (props con spread, componentes, valores dinámicos), se calla en vez de adivinar. Los mensajes del producto están en inglés. Detalles: [docs/guard-rules.md](https://github.com/JJBeta-Dev/jota/blob/main/docs/guard-rules.md).

## Usarlo como plugin de ESLint

```js
// eslint.config.js (flat config)
import tsParser from "@typescript-eslint/parser";
import { configs } from "jota-guard";

export default [
  {
    files: ["**/*.{tsx,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  configs.recommended,
];
```

## Licencia

MIT © JJBeta
