[English](README.md) · [Español](README.es.md)

# jota-guard

Accessibility, semantics and performance checks for JSX and TSX files. Works with React, Solid, Preact and Jota. It is an ESLint plugin plus a command line tool.

> **Status: pre-alpha.** The code in this repository is ready, but the version published on npm is still the `0.0.1` name placeholder. Until the first real release, run it from the repository.

Guard is static analysis: it catches a known subset of problems and cannot promise that a page is fully accessible.

## Quick start

```bash
npx jota-guard            # checks every .tsx and .jsx file in the current folder
npx jota-guard src        # or specific folders and files
```

Example output:

```text
src/Page.tsx
   8:9  error    <div> with onClick is not keyboard accessible. Use <button type="button"> (or <a href>) instead   jota/clickable-role
   9:9  error    <img> needs an `alt` attribute. Describe the image, or use alt="" if it is purely decorative      jota/img-alt

✖ 2 problems (2 errors, 0 warnings)
```

Exit codes: `0` nothing to fix, `1` problems found, `2` usage error.

## Options

| Option | Meaning |
|---|---|
| `--preset <name>` | `recommended` (default), `strict` (warnings become errors) or `a11y-only` (turns `img-size` off) |
| `--rule <id>=<level>` | set one rule to `error`, `warn` or `off` (repeatable), e.g. `--rule heading-order=error` |
| `--config <file>` | read settings from a JSON file (default: `jota.config.json` when present) |
| `--format <name>` | `stylish` (default) or `json` |
| `--max-warnings <n>` | fail when there are more than `n` warnings |
| `--ignore <glob>` | extra glob to ignore, repeatable (`node_modules`, `dist`, `build` are always ignored) |

## Configurable severity

`heading-order` and `img-size` warn by default, and you can make them errors:

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

Priority: command line options, then the config file, then the preset.

## Rules

| Rule | Default | Checks |
|---|---|---|
| `jota/img-alt` | error | `<img>` has `alt` (use `alt=""` for decorative images) |
| `jota/img-size` | warn | `<img>` has `width` and `height` (prevents layout shift) |
| `jota/clickable-role` | error | no `onClick` on non-interactive elements without role, `tabIndex` and a key handler |
| `jota/button-name` | error | buttons have an accessible name |
| `jota/link-name` | error | links have an accessible name and a real `href` |
| `jota/input-label` | error | inputs, selects and textareas are labelled |
| `jota/heading-order` | warn | no skipped heading levels, a single `h1` |
| `jota/html-lang` | error | `<html>` has `lang` |
| `jota/no-positive-tabindex` | warn | no `tabIndex` greater than 0 |
| `jota/media-captions` | warn | `<video>` has a captions track |

Full details, examples and edge cases: [docs/guard-rules.md](https://github.com/JJBeta-Dev/jota/blob/main/docs/guard-rules.md). When a rule cannot be sure (spread props, components, dynamic values), it stays silent instead of guessing.

## Use as an ESLint plugin

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

Presets: `recommended`, `strict`, `a11y-only`. The parser block above is needed so ESLint understands JSX and TSX.

## License

MIT © JJBeta
