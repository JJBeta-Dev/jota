# Reactivity benchmarks

Measured on 2026-11-06 with `pnpm --filter jota-bench bench` (after `pnpm -r build`).
Node v24.18.0, AMD Ryzen 5 7600, Windows. Solid 1.9.18, Preact Signals 1.14.5. Median of 7 runs, milliseconds, **lower is better**.

| Scenario | Jota | Solid | Preact Signals |
|---|---:|---:|---:|
| 1,000,000 writes to one signal read by one effect | 44.8 | 147 | **37.9** |
| Chain of 1,000 computeds, 1,000 updates | 48.0 | 128 | **41.9** |
| Fan-out: one signal read by 10,000 effects, 100 updates | 35.0 | 75.4 | **30.7** |
| Diamond: one signal, 1,000 computeds, one sum, 1,000 updates | 50.1 | 141 | **45.0** |
| Batch: 10 signals written together, one effect, 50,000 batches | **9.2** | 46.0 | 14.7 |
| Create 100,000 signals and 100,000 computeds | 53.8 | 60.0 | **14.1** |

Bold marks the best result per row. Jota is faster than Solid in five rows and, in the sixth (creating nodes), level with it within noise (three runs: 54-65 ms against 38-60 ms). Against Preact Signals Jota is 11-18% slower in rows 1 to 4, about 1.6x faster in the batch row, and about 4x slower when creating nodes. Three consecutive runs gave the same picture.

## How to read this

- Jota is now ahead of Solid in most rows and close to Preact Signals: roughly 10-20% behind it when one source feeds effects, chains and diamonds, ahead of it in batching, and well behind it (about 4x) when creating many nodes.
- These are micro-benchmarks of the **reactive graph only**, in Node. They include no DOM, no rendering and no browser, so they say nothing about real page performance, bundle size, or memory.
- They are not a React comparison: React has no fine-grained reactivity to compare in this setup.
- Numbers move between runs and machines. Treat differences under ~20% as noise.
- A first version of this benchmark was wrong for Solid: effects created inside `createRoot` do not run until the root function returns, so writes happened with no subscribers. The scenarios now build the graph inside the root and run the measured work afterwards.
- Before the allocation fixes in `packages/core/src/reactive.ts` (no array copies in the notify loops, a queue without `Array.shift`), Jota was 1.1x to 6x slower than Solid.

Optimization rounds (2026-11-06): dependency tracking now keeps each effect's sources in arrays and, when a run reads the same sources in the same order as the last one, changes no subscription at all (this took the single-signal row from 82 to 45 ms). Earlier in the day: an effect or computed keeps its subscriptions between runs and only unsubscribes from sources it no longer reads, and owners allocate their child set and cleanup list on first use, observer sets are allocated on first subscription, and a first run allocates a single source map. Remaining idea: cheaper creation of signals and computeds (each computed allocates two arrays and a closure).
