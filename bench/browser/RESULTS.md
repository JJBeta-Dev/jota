# Rendering benchmark in a real browser

Measured on 2026-11-13 with `pnpm -r build && pnpm --filter jota-bench-browser bench`.
Microsoft Edge 157 (headless, driven by puppeteer-core), AMD Ryzen 5 7600, Windows, Node v24.18.0, Vite 8.
Jota (this repository) against Solid 1.9, Preact 10, React 19, Vue 3.5, Svelte 5 and Angular 22: the same table and the same operations (js-framework-benchmark style: 1,000 and 10,000 rows). Each app is written the way its own documentation recommends: a signal or ref per label in Jota, Solid, Vue, Svelte and Angular (zoneless, signals); immutable rows with a memoized row in Preact and React. Every operation is awaited until the library has updated the DOM (`flushSync`, `nextTick`, `tick()`).
Median of 11 runs after a warm-up, in milliseconds, **including a forced layout**; lower is better.

Three runs were made. The table shows the median of the three for each cell; bold is the best of the row.

| Operation | Jota | Solid | Preact | React | Vue | Svelte | Angular |
|---|---:|---:|---:|---:|---:|---:|---:|
| create 1,000 rows | 31.1 | **25.4** | 34.0 | 30.8 | 29.0 | 27.9 | 25.0 |
| replace 1,000 rows | 35.6 | **27.6** | 36.7 | 40.7 | 28.0 | 29.9 | 35.3 |
| update every 10th row (1,000 rows) | 8.4 | **6.9** | 9.4 | 9.3 | 8.5 | 8.6 | 8.2 |
| select a row (1,000 rows) | **0.3** | **0.3** | 0.4 | 0.4 | 0.9 | **0.3** | **0.3** |
| swap two rows (1,000 rows) | 3.4 | 2.9 | 3.4 | 26.5 | 4.5 | 3.0 | **2.7** |
| remove a row (1,000 rows) | **2.8** | 2.9 | 3.2 | 3.0 | 4.3 | **2.7** | **2.8** |
| create 10,000 rows | 307 | **278** | 354 | 424 | 327 | 305 | 306 |
| append 1,000 rows to 1,000 | 34.3 | **26.0** | 36.6 | 34.8 | 33.5 | 30.9 | 30.0 |
| clear 1,000 rows | 4.8 | **2.8** | 4.0 | 4.5 | 3.7 | 3.0 | 4.2 |

"create 1,000 rows": Angular's 25.0 and Solid's 25.4 are a tie.

| JavaScript of the benchmark app | Jota | Solid | Preact | React | Vue | Svelte | Angular |
|---|---:|---:|---:|---:|---:|---:|---:|
| Minified | 8.9 kB | 13.6 kB | 20.8 kB | 221.0 kB | 65.0 kB | 34.3 kB | 113.8 kB |
| Gzip | 3.7 kB | 5.6 kB | 8.4 kB | 68.5 kB | 25.4 kB | 13.6 kB | 37.7 kB |

## How to read this

- **Speed: Jota is in the slower half.** Solid is the fastest or tied in eight of nine rows. Svelte and Angular follow closely. Jota is 20 to 30% slower than Solid at creating, replacing and appending rows, and about 70% slower at clearing them. It ties the leaders at selecting and removing a row.
- **Per cell, single runs differ by up to 25%**, so small gaps (Jota against Vue or Preact, for example) are not conclusions. The gaps against Solid repeat in all three runs.
- **What repeats in every run:** React takes about ten times longer to swap two rows; React and Preact are the slowest at 10,000 rows; Vue is the slowest at selecting a row.
- **Size is where Jota leads, and it is stable:** 3.7 kB gzip for the whole app, against 5.6 (Solid), 8.4 (Preact), 13.6 (Svelte), 25.4 (Vue), 37.7 (Angular) and 68.5 (React). Jota was 2.9 kB before hydration support was added.
- **A small app flatters small runtimes.** Svelte and Solid compile per component, so their size grows with the app; React, Vue and Angular pay most of their size once. This table says nothing about a large application.
- The first version of this benchmark found a real problem: swapping two rows took 22 ms against 2.2 ms for Solid, because Jota's list reconciliation moved about a thousand nodes. It now uses a longest-increasing-subsequence diff and moves two (see `packages/core/test/reconcile.test.ts`).
- This is not the official js-framework-benchmark: no tracing of paint time, no memory or startup metrics, one browser, one machine. It measures script time plus forced layout, not what the user sees on screen.
- The Solid app is compiled with `vite-plugin-solid`; the Jota app with `vite-plugin-jota`. The two `main.tsx` files are meant to stay equivalent.
