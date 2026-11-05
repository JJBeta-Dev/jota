# Jota Guard — Rule specification (draft v0.1)

Status: **v0.1 implemented** (2026-11-05) in `packages/guard`: all ten rules, three presets and the CLI, with 130 passing tests. This document is the specification they follow. Anything not listed here is out of scope for the first release.

Guard is an ESLint plugin plus a CLI (`npx jota-guard`) that audits JSX/TSX files (React, Solid, Preact, Jota). Rules are static checks on the syntax tree. Guard never claims a page is "100% accessible": static analysis catches a known subset of problems and says so.

## 1. Principles
1. **Every message is actionable**: what is wrong, how to fix it, link to this document.
2. **Few false positives.** A rule that cannot be sure stays silent or warns, it does not fail the build.
3. **Static only.** Rules that need a rendered page (real contrast, real focus order) are out of scope for v1.
4. **Framework-neutral.** Works on any JSX; the same rule IDs are reused when the Jota compiler runs them at build time.
5. **English messages first**, Spanish translations later (Stage 4).

## 2. Severity and exit codes
| Level | Meaning | CLI effect |
|---|---|---|
| `error` | Breaks accessibility, semantics or CLS for sure | exit code 1 |
| `warn` | Likely problem or best practice | exit code 0, printed |
| `off` | Disabled | nothing |

`--max-warnings <n>` turns warnings into failures after `n`. Default config: the `recommended` preset below.

## 3. First batch of rules (v0.1)

Format: **id** · default level · what it checks · bad / good · message · edge cases.

### `jota/img-alt` · error
`<img>` must have an `alt` attribute. Decorative images use `alt=""`.
```tsx
// bad
<img src="/photo.jpg" />
// good
<img src="/photo.jpg" alt="Team working at the studio" />
<img src="/divider.svg" alt="" />
```
Message: ``<img> needs an `alt` attribute. Describe the image, or use alt="" if it is purely decorative.``
Edge cases: spread props (`{...props}`) → rule stays silent. `alt={expr}` is accepted.

### `jota/img-size` · warn
`<img>` should declare `width` and `height` (or an `aspect-ratio` style) to avoid layout shift (CLS).
```tsx
// bad
<img src="/photo.jpg" alt="Studio" />
// good
<img src="/photo.jpg" alt="Studio" width={800} height={600} />
```
Message: `<img> has no width/height. Add both so the browser can reserve space (prevents layout shift).`
Edge cases: images with `fill`-style frameworks components are ignored; `style` containing `aspect-ratio` passes.

### `jota/clickable-role` · error
Non-interactive elements (`div`, `span`, `li`, `p`, …) with `onClick` must be replaced with a `<button>`/`<a>` or have BOTH a valid interactive `role` and `tabIndex`, plus a keyboard handler.
```tsx
// bad
<div onClick={openMenu}>Open</div>
// good
<button type="button" onClick={openMenu}>Open</button>
```
Message: `<div> with onClick is not keyboard accessible. Use <button type="button"> (or <a href>) instead.`
Edge cases: elements with `role="button"` + `tabIndex={0}` + `onKeyDown` pass. Handlers inherited via spread → silent.

### `jota/button-name` · error
`<button>` (and elements with `role="button"`) must have an accessible name: text content, `aria-label`, or `aria-labelledby`.
```tsx
// bad
<button><svg aria-hidden="true">…</svg></button>
// good
<button aria-label="Close dialog"><svg aria-hidden="true">…</svg></button>
```
Message: `<button> has no accessible name. Add visible text or an aria-label.`
Edge cases: children that are expressions (`{label}`) count as text; icon-only components can't be judged and are ignored.

### `jota/link-name` · error
`<a>` must have an accessible name and a real `href` (not `#` or `javascript:`) when used for navigation.
Message: `<a> has no accessible name. Add visible text or an aria-label.`

### `jota/input-label` · error
`<input>`, `<select>`, `<textarea>` must be labelled: wrapped in `<label>`, matched by `htmlFor`/`id`, or have `aria-label`/`aria-labelledby`. `type="hidden"` and `type="submit|button|reset|image"` are exempt.
```tsx
// bad
<input type="email" />
// good
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```
Message: `<input> has no label. Connect a <label htmlFor>, wrap it in <label>, or add aria-label.`

### `jota/heading-order` · warn
Heading levels must not skip (an `h4` right after an `h2`) and a file/route should have a single `h1`. Checked within a single component file; cross-file order is out of scope for v1.
Message: `Heading jumps from <h2> to <h4>. Use <h3>, and style it with CSS if you need a smaller look.`

### `jota/html-lang` · error
`<html>` elements in JSX must declare `lang`.
Message: `<html> needs a lang attribute (for example lang="en"). Screen readers use it to pick the voice.`

### `jota/no-positive-tabindex` · warn
`tabIndex` greater than 0 breaks natural focus order.
Message: `tabIndex={n} with n > 0 changes the natural tab order. Use 0 or -1.`

### `jota/media-captions` · warn
`<video>` should include a `<track kind="captions">` unless it is `muted` with no audio content declared.
Message: `<video> has no captions track. Add <track kind="captions" src="…" srclang="en">.`

## 4. Presets
| Preset | Rules |
|---|---|
| `recommended` (default) | all rules above at their default level |
| `strict` | warnings become errors |
| `a11y-only` | everything except `img-size` |

## 5. Performance budget (config file)
Static budget checks need build output, so they ship with the Jota Vite plugin (Stage 2/3), not with Guard v0.1. The config shape is fixed now so it does not change later:

```ts
// jota.config.ts
import { defineConfig } from "jota-js/config";

export default defineConfig({
  guard: { preset: "recommended" },
  budget: {
    maxJsPerRoute: "10kb",   // gzip size of JS loaded by a route
    maxImageWeight: "200kb", // per image after optimization
    maxCssPerRoute: "20kb",
  },
});
```

## 6. CLI behaviour (v0.1)
```text
npx jota-guard [paths...]       # default: current directory, **/*.{tsx,jsx}
  --preset <name>               # recommended | strict | a11y-only
  --format <stylish|json>       # human or machine output
  --max-warnings <n>
  --ignore <glob>
  --fix                         # NOT in v0.1: no auto-fixes, to avoid wrong edits
```
Output (stylish):
```text
src/Header.tsx
  12:5  error  <div> with onClick is not keyboard accessible. Use <button type="button"> instead.  jota/clickable-role
  30:3  error  <img> needs an `alt` attribute. Describe the image, or use alt="" if decorative.   jota/img-alt

2 problems (2 errors, 0 warnings)
```
ESLint integration: the same rules are exported as `jota-guard/eslint-plugin` with flat-config support.

## 7. Technical approach (Stage 1)
- TypeScript strict. Parse with `@typescript-eslint/parser` (handles JS, JSX, TS, TSX); rules written with the ESLint rule API so the plugin and the CLI share one implementation. The CLI is a thin wrapper around the ESLint Node API with the Jota config preloaded.
- Test each rule with `RuleTester`: at least 5 valid and 5 invalid cases, including spread props and edge cases above.
- Sample project `examples/guard-demo/` with planted violations; CI asserts exit code 1 on it and 0 on the fixed copy.
- No network access, no telemetry. Published to npm with provenance from GitHub Actions.

## 8. Explicitly out of scope for v0.1
Real color contrast, focus order at runtime, ARIA validity across components, auto-fix, framework-specific component libraries, Vue/Svelte/Angular templates, CSS checks.

## 9. Owner decisions
1. Severity of `heading-order` and `img-size`: **`warn` by default, configurable** (decided 2026-11-05). Change it with `--rule heading-order=error`, the `strict` preset, or a `jota.config.json` file: `{ "guard": { "rules": { "heading-order": "error" } } }`. Command line beats config file, which beats the preset.
2. Rule ID prefix: **`jota/`** (decided 2026-11-03).
3. Auto-fix: **yes**, planned for v0.2 for safe cases only (for example adding `type="button"`). Not in v0.1.
