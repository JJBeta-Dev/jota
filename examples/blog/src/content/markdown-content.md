---
title: Posts written in Markdown
date: 2026-11-13
summary: Write content in Markdown; the build checks its headings and images.
---

This post is a Markdown file. The build turned it into HTML, so the page still ships no JavaScript.

## What the build checks

- An image without alt text **fails the build**.
- A heading that skips a level prints a warning.

## How to load a folder of posts

```ts
const files = import.meta.glob("./content/*.md", { eager: true });
```
