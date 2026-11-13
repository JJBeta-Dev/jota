---
title: Markdown content
description: Write pages and posts in Markdown. The build checks their images and headings.
order: 6
---

# Markdown content

Write content in `.md` files and import it like any module. The page stays plain HTML: no JavaScript is added. This page is a Markdown file.

## Set up

```ts
import jota from "vite-plugin-jota";
import jotaStatic from "vite-plugin-jota/static";
import { jotaMarkdown } from "vite-plugin-jota/markdown";

export default defineConfig({ plugins: [jota(), jotaMarkdown(), jotaStatic()] });
```

For the types, add this line to a `.d.ts` file in `src`:

```ts
/// <reference types="vite-plugin-jota/md" />
```

## Import a file

```tsx
import Post, { frontmatter, headings, html } from "./post.md";

<article innerHTML={html} />;
```

- `frontmatter`: the data between the `---` lines at the top (strings, numbers, booleans and lists).
- `headings`: the depth, text and id of each heading. Every heading gets an `id`, so you can build a table of contents.
- `html`: the document as HTML.
- The default export is a component: `<Post class="prose" />`.

## A folder of posts, with types

```ts
import { defineCollection } from "jota-js/content";

const posts = defineCollection(import.meta.glob("./posts/*.md", { eager: true }), {
  title: "string",
  date: "string",
  draft: "boolean?",
});
```

Each entry has `slug`, `data`, `html` and `headings`. A missing or mistyped field stops the build and names the file.

## What the build checks

| Problem | Result |
|---|---|
| An image without alt text | The build fails and names the file |
| A heading that skips a level | A warning |

Turn the checks off with `jotaMarkdown({ guard: false })`.

## Syntax highlighting

Pass `highlight(code, language)` and return HTML. It runs while building, so the page still has no JavaScript.

## Limits

HTML written inside Markdown is not sanitized: use it for your own content only. Components inside Markdown (MDX) are not supported.
