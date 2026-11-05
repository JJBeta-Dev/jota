# Rendering benchmark in a real browser

Measured on 2026-11-05 with `pnpm -r build && pnpm --filter jota-bench-browser bench`.
Microsoft Edge 156 (headless, driven by puppeteer-core), AMD Ryzen 5 7600, Windows, Node v24.18.0.
Jota (this repository) against Solid 1.9.18, same table app and same operations in both (js-framework-benchmark style: 1,000 and 10,000 rows, a signal per label).
Median of 11 runs after a warm-up, in milliseconds, **including a forced layout**; lower is better.

| Operation | Jota | Solid |
|---|---:|---:|
| create 1,000 rows | 23.6 | **23.0** |
| replace 1,000 rows | **25.7** | 25.8 |
| update every 10th row (1,000 rows) | 6.3 | **6.0** |
| select a row (1,000 rows) | 0.4 | **0.3** |
| swap two rows (1,000 rows) | **1.7** | 1.9 |
| remove a row (1,000 rows) | 2.5 | **1.7** |
| create 10,000 rows | 272 | **252** |
| append 1,000 rows to 1,000 | **26.8** | 28.5 |
| clear 1,000 rows | 3.0 | **1.7** |

| JavaScript of the benchmark app | Jota | Solid |
|---|---:|---:|
| Minified | 6.8 kB | 10.8 kB |
| Gzip | 2.9 kB | 4.6 kB |

## How to read this

- Jota is within roughly 10% of Solid on most operations (a few are faster, several slightly slower), with a smaller bundle. Differences under about 10% are inside the noise of a single machine.
- Remove and clear are about 1.5x to 1.8x slower than Solid here: Jota removes nodes one by one, Solid has special cases.
- The first version of this benchmark found a real problem: swapping two rows took 22 ms against 2.2 ms for Solid, because Jota's list reconciliation moved about a thousand nodes. It now uses a longest-increasing-subsequence diff and moves two (see `packages/core/test/reconcile.test.ts`).
- This is not the official js-framework-benchmark: no tracing of paint time, no memory or startup metrics, one browser, one machine, and no React. It measures script time plus forced layout, not what the user sees on screen.
- The Solid app is compiled with `vite-plugin-solid`; the Jota app with `vite-plugin-jota`. The two `main.tsx` files are meant to stay equivalent.
