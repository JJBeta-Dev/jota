# Rendering benchmark in a real browser

Measured on 2026-11-13 with `pnpm -r build && pnpm --filter jota-bench-browser bench`.
Microsoft Edge 157 (headless, driven by puppeteer-core), AMD Ryzen 5 7600, Windows, Node v24.18.0.
Jota (this repository) against Solid 1.9, Preact 10 and React 19: the same table and the same operations (js-framework-benchmark style: 1,000 and 10,000 rows). Jota and Solid keep a signal per label; Preact and React use immutable rows, a keyed list and a memoized row, with synchronous rendering so the work is inside the timer.
Median of 11 runs after a warm-up, in milliseconds, **including a forced layout**; lower is better. One of three runs made that day; the others differ by up to 20% per cell.

| Operation | Jota | Solid | Preact | React |
|---|---:|---:|---:|---:|
| create 1,000 rows | 39.0 | 31.1 | 34.4 | **30.6** |
| replace 1,000 rows | 35.3 | **33.7** | 40.2 | 34.5 |
| update every 10th row (1,000 rows) | 8.6 | **7.7** | 9.6 | 8.2 |
| select a row (1,000 rows) | 0.4 | **0.3** | 0.4 | **0.3** |
| swap two rows (1,000 rows) | 5.5 | **2.5** | 2.9 | 27.4 |
| remove a row (1,000 rows) | 2.9 | **2.6** | 3.7 | 3.0 |
| create 10,000 rows | 304 | **273** | 376 | 408 |
| append 1,000 rows to 1,000 | 34.7 | **27.7** | 49.2 | 39.6 |
| clear 1,000 rows | 4.4 | **2.5** | 5.6 | 5.7 |

| JavaScript of the benchmark app | Jota | Solid | Preact | React |
|---|---:|---:|---:|---:|
| Minified | 8.2 kB | 11.1 kB | 21.0 kB | 224.0 kB |
| Gzip | 3.4 kB | 4.7 kB | 8.5 kB | 69.8 kB |

## How to read this

- **Speed: nobody wins clearly at 1,000 rows.** The four libraries are within about 20% of each other on most rows, and the order changes between runs on this machine (in the other two runs React or Solid led most rows and Jota tied the swap at 2.8 ms). Jota is not the fastest here; Solid is the most consistent.
- **Two differences repeat in every run:** React takes about ten times longer to swap two rows (23 to 27 ms against 2.5 to 5.5 ms), and React and Preact are slower than Jota and Solid at 10,000 rows.
- **Size is where Jota leads, and it is stable:** 3.4 kB gzip for the whole app, against 4.7 (Solid), 8.5 (Preact) and 69.8 (React). The Jota number was 2.9 kB before hydration support was added.
- The first version of this benchmark found a real problem: swapping two rows took 22 ms against 2.2 ms for Solid, because Jota's list reconciliation moved about a thousand nodes. It now uses a longest-increasing-subsequence diff and moves two (see `packages/core/test/reconcile.test.ts`).
- This is not the official js-framework-benchmark: no tracing of paint time, no memory or startup metrics, one browser, one machine. It measures script time plus forced layout, not what the user sees on screen.
- The Solid app is compiled with `vite-plugin-solid`; the Jota app with `vite-plugin-jota`. The two `main.tsx` files are meant to stay equivalent.
