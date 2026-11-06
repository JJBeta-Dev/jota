# Reactivity benchmarks

Measured on 2026-11-06 with `pnpm --filter jota-bench bench` (after `pnpm -r build`).
Node v24.18.0, AMD Ryzen 5 7600, Windows. Solid 1.9.18, Preact Signals 1.14.5. Median of 7 runs, milliseconds, **lower is better**.

| Scenario | Jota | Solid | Preact Signals |
|---|---:|---:|---:|
| 1,000,000 writes to one signal read by one effect | 82.3 | 144 | **36.6** |
| Chain of 1,000 computeds, 1,000 updates | 90.3 | 123 | **38.5** |
| Fan-out: one signal read by 10,000 effects, 100 updates | 71.9 | 64.4 | **26.6** |
| Diamond: one signal, 1,000 computeds, one sum, 1,000 updates | 129 | 135 | **44.8** |
| Batch: 10 signals written together, one effect, 50,000 batches | 21.2 | 44.2 | **14.8** |
| Create 100,000 signals and 100,000 computeds | 50.9 | 33.6 | **10.6** |

Bold marks the best result per row. Jota is clearly faster than Solid in rows 1, 2 and 5, level with it in the diamond (within noise), and slower in fan-out and in creating nodes. Three consecutive runs gave the same picture; the creation row moved between 48 and 51 ms for Jota and between 34 and 46 ms for Solid.

## How to read this

- Jota is in the same range as Solid: faster in three scenarios, level in one, up to 1.5x slower in the other two. Preact Signals is still clearly faster than both (roughly 1.5x to 5x faster than Jota here).
- These are micro-benchmarks of the **reactive graph only**, in Node. They include no DOM, no rendering and no browser, so they say nothing about real page performance, bundle size, or memory.
- They are not a React comparison: React has no fine-grained reactivity to compare in this setup.
- Numbers move between runs and machines. Treat differences under ~20% as noise.
- A first version of this benchmark was wrong for Solid: effects created inside `createRoot` do not run until the root function returns, so writes happened with no subscribers. The scenarios now build the graph inside the root and run the measured work afterwards.
- Before the allocation fixes in `packages/core/src/reactive.ts` (no array copies in the notify loops, a queue without `Array.shift`), Jota was 1.1x to 6x slower than Solid.

Optimization rounds (2026-11-06): an effect or computed keeps its subscriptions between runs and only unsubscribes from sources it no longer reads, and owners allocate their child set and cleanup list on first use, observer sets are allocated on first subscription, and a first run allocates a single source map. Remaining idea: cheaper creation of signals and computeds, and cheaper notification for effects with a single source.
