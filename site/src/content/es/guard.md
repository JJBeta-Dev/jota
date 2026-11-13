---
title: Jota Guard
description: Reglas de accesibilidad que rompen el build. Funciona en cualquier proyecto JSX.
order: 5
---

# Jota Guard

Guard revisa tus archivos `.tsx` y `.jsx` y detiene el build cuando encuentra un problema de accesibilidad. Sirve también en proyectos React, Solid o Preact.

```bash
npm install -D jota-guard
npx jota-guard src
```

## Qué detecta

Tiene 31 reglas. Algunas de las que fallan como error:

| Regla | Problema |
|---|---|
| `img-alt` | Imagen sin texto alternativo |
| `clickable-role` | `<div>` o `<span>` con `onClick` y sin rol ni teclado |
| `input-label` | Campo de formulario sin etiqueta |
| `button-name` y `link-name` | Botón o enlace sin nombre accesible |
| `html-lang` | `<html>` sin idioma |
| `aria-role-valid` y `aria-props` | Roles o atributos ARIA que no existen |
| `media-captions` | Video sin subtítulos |

La lista completa, con ejemplos, está en [la referencia de reglas](https://github.com/JJBeta-Dev/jota/blob/main/docs/guard-rules.md) (en inglés).

## Opciones

| Opción | Qué hace |
|---|---|
| `--preset` | `recommended` (por defecto), `strict` o `a11y-only` |
| `--rule id=nivel` | Cambia una regla a `error`, `warn` u `off` |
| `--fix` | Repara lo seguro: quita roles redundantes, `autofocus` y `accesskey` |
| `--format` | `stylish`, `json`, `sarif` o `github` |
| `--max-warnings n` | Falla si hay más de `n` avisos |

Guard nunca inventa texto accesible: eso lo escribes tú.

## En GitHub Actions

```yaml
- run: npx jota-guard src --format github
```

Cada problema aparece como una anotación en la línea del pull request.

## En el editor

La extensión de VS Code (`packages/vscode` en el repositorio) muestra los problemas al abrir y guardar cada archivo.

## Configuración

```json
{ "guard": { "preset": "strict", "rules": { "heading-order": "error" }, "ignore": ["**/generated/**"] } }
```

Guárdalo como `jota.config.json` en la raíz del proyecto.
