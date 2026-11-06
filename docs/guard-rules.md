# Jota Guard — Rule specification (draft v0.1)

Status: **v0.1 implemented** (2026-11-05) in `packages/guard`: thirty-one rules (the first ten on 2026-11-05, twenty-one more on 2026-11-06), three presets and the CLI, with 369 passing tests. This document is the specification they follow. Anything not listed here is out of scope for the first release.

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

## 3. Rules

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

### `jota/iframe-title` · error
`<iframe>` needs a `title` (or `aria-label`/`aria-labelledby`) so screen reader users know what it holds.
Message: `<iframe> needs a title that says what it contains. Screen readers announce it.`
Edge cases: a dynamic `title={name}` passes; spread props → silent; components are not checked.

### `jota/aria-role-valid` · error
A static `role` on a DOM element must contain at least one real ARIA role (the WAI-ARIA 1.2 list, `doc-*` and `graphics-*`). A list is a fallback chain, so `role="foo button"` passes.
Message: `role="buton" is not a valid ARIA role. Check the spelling, or remove the role and use the native element.`
Edge cases: `role={expr}` passes; components are not checked.

### `jota/aria-hidden-focusable` · error
`aria-hidden="true"` must not be set on an element a keyboard user can focus: `button`, `select`, `textarea`, `summary`, `a` with `href`, `input` (not `type="hidden"`), or anything with `tabIndex >= 0`. `tabIndex={-1}` is accepted.
Message: `<button> is hidden from screen readers (aria-hidden) but a keyboard user can still focus it. Remove aria-hidden or add tabIndex={-1}.`

### `jota/no-distracting-elements` · error
`<marquee>` and `<blink>` move or flash and cannot be paused.
Message: `<marquee> moves or flashes and cannot be paused. Remove it and use CSS animation that respects prefers-reduced-motion.`

### `jota/valid-lang` · error
A static `lang` on a DOM element must look like a BCP 47 tag (`en`, `es-CO`, `zh-Hant-TW`). It checks the form, not the language registry. The empty string and dynamic values are not judged.
Message: `lang="english" is not a language tag. Use a code such as "en", "es" or "es-CO".`

### `jota/no-autofocus` · warn
`autoFocus` on a DOM element moves focus without being asked. `autoFocus={false}` passes.
Message: `autoFocus moves focus without the user asking, which disorients screen reader and keyboard users. Remove it.`

### `jota/no-access-key` · warn
`accessKey` shortcuts clash with screen reader and browser shortcuts.
Message: `accessKey shortcuts clash with screen reader and browser shortcuts. Remove it and let users reach the control with Tab.`

### `jota/no-redundant-alt` · warn
`alt` text on `<img>` should not contain the words image, photo, picture, graphic, img or icon, because screen readers already say "image".
Message: `Screen readers already say "image". Remove the word "photo" from the alt text and describe what the image shows.`
Edge cases: dynamic `alt={expr}` passes; whole words only (`Imagery` passes).

### `jota/heading-has-content` · error
`<h1>` to `<h6>` must have text, an expression, or an `aria-label`. Screen reader users jump between headings, and an empty one is a dead stop.
Message: `<h2> is empty. Screen reader users navigate by headings, so give it text.`

### `jota/aria-props` · error
Every `aria-*` attribute on a DOM element must be a real ARIA attribute (WAI-ARIA 1.2 list). Catches typos such as `aria-lable`.
Message: `aria-lable is not a valid ARIA attribute. Check the spelling.`

### `jota/scope-valid` · error
`scope` belongs only on `<th>`.
Message: `The scope attribute only works on <th>, not on <td>. Move it to the header cell.`

### `jota/aria-unsupported-elements` · error
`<meta>`, `<html>`, `<script>`, `<style>`, `<head>`, `<title>`, `<base>`, `<link>` and `<noscript>` are not exposed to assistive technology, so `role` and `aria-*` on them do nothing.
Message: `<meta> does not support role or aria-* attributes. Remove aria-hidden.`

### `jota/mouse-events-have-key-events` · warn
`onMouseOver` needs `onFocus` and `onMouseOut` needs `onBlur`, so keyboard users get the same behaviour.
Message: `onMouseOver needs onFocus too, so keyboard users get the same behaviour as mouse users.`

### `jota/no-redundant-roles` · warn
A `role` equal to the element's implicit role (`<button role="button">`, `<nav role="navigation">`, `<a href role="link">`, `<ul role="list">`, headings, `<main>`, `<form>`, `<article>`...) is noise.
Message: `<button> already has the role "button". Remove the role attribute.`

### `jota/no-noninteractive-tabindex` · warn
`tabIndex` of 0 or more on plain content (`div`, `p`, `span`...) adds a tab stop that does nothing. It is accepted when the element has a `role`, `contentEditable`, or an event handler (those are `clickable-role`'s job), and `tabIndex={-1}` is always fine.
Message: `<div> is not interactive, so tabIndex={0} puts a stop in the tab order that does nothing. Remove it, or give the element a role and a handler.`

### `jota/anchor-ambiguous-text` · warn
A link whose only text is "click here", "here", "read more", "more", "learn more", "link" or "this" means nothing when screen readers list links on their own. Links with expressions or child elements are not judged.
Message: `The link text "Read more" means nothing out of context (screen readers list links on their own). Say where the link goes.`

### `jota/role-has-required-aria-props` · error
A static `role` must come with the `aria-*` attributes it needs: `checkbox`, `radio`, `switch`, `menuitemcheckbox` and `menuitemradio` need `aria-checked`; `slider` and `scrollbar` need `aria-valuenow`; `heading` needs `aria-level`. Native `<input>` elements and `<h1>` to `<h6>` already expose that state and are accepted.
Message: `role="checkbox" needs aria-checked. Without it, screen readers cannot tell the state.`

### `jota/autocomplete-valid` · error
A static `autoComplete` must be one of the HTML autofill values (`email`, `given-name`, `current-password`, `postal-code`...), optionally with `section-*`, `shipping`/`billing`, a contact type (`home`, `work`...) and `webauthn`.
Message: `autoComplete="e-mail" is not a valid value. Use one from the HTML list, such as "email", "given-name" or "current-password".`

### `jota/no-interactive-element-to-noninteractive-role` · error
`<button>`, `<a href>`, `<input>`, `<select>` and `<textarea>` must not get a role that says they are not interactive (`presentation`, `none`, `img`, `heading`, `list`, `article`, `group`...). Roles such as `tab`, `menuitem` or `link` on a button are fine.
Message: `<button> is interactive, but role="presentation" tells assistive technology it is not. Remove the role or use a different element.`

### `jota/aria-activedescendant-has-tabindex` · error
An element with `aria-activedescendant` must be able to take focus: a native input, select, textarea or button, a link with `href`, or an element with `tabIndex`.
Message: `<div> uses aria-activedescendant but cannot take focus. Add tabIndex={0} (or tabIndex={-1} if focus is set by script).`

### `jota/prefer-tag-over-role` · warn
A `<div>` or `<span>` with a role that has a native element (`button`, `link`, `heading`, `list`, `listitem`, `navigation`, `main`, `banner`, `contentinfo`, `complementary`, `article`, `form`, `checkbox`, `textbox`) is better written with that element. Roles with no single native equivalent (`img`, `dialog`, `tabpanel`...) are not flagged.
Message: `<div role="button"> can be <button>. The native element brings keyboard support and semantics for free.`

## 4. Presets
| Preset | Rules |
|---|---|
| `recommended` (default) | all rules above at their default level |
| `strict` | warnings become errors |
| `a11y-only` | everything except `img-size` |

## 5. Performance budget

The budget is not part of Guard. It lives in the static build of `vite-plugin-jota`, because it needs the build output:

```ts
// vite.config.ts
jotaStatic({
  budget: {
    maxJsPerRoute: "10kb",   // gzip size of the scripts and preloaded modules a page loads
    maxCssPerRoute: "20kb",  // gzip size of the stylesheets a page links
    maxHtmlPerRoute: "20kb", // size of one HTML page
    maxImageWeight: "200kb", // size of any single image file
  },
});
```

When a limit is exceeded the build fails and lists each page or file over its limit.

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
