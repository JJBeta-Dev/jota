# Reactivity benchmarks

Measured on 2026-11-05 with `pnpm --filter jota-bench bench` (after `pnpm -r build`).
Node v24.18.0, AMD Ryzen 5 7600, Windows. Solid 1.9.18, Preact Signals 1.14.5. Median of 7 runs, milliseconds, **lower is better**.

| Scenario | Jota | Solid | Preact Signals |
|---|---:|---:|---:|
| 1,000,000 writes to one signal read by one effect | 113 | 147 | **42.5** |
| Chain of 1,000 computeds, 1,000 updates | 130 | 122 | **38.3** |
| Fan-out: one signal read by 10,000 effects, 100 updates | 134 | 65.5 | **30.7** |
| Diamond: one signal, 1,000 computeds, one sum, 1,000 updates | 181 | 143 | **43.6** |
| Batch: 10 signals written together, one effect, 50,000 batches | 38.8 | 49.4 | **15.0** |
| Create 100,000 signals and 100,000 computeds | 71.3 | 50.2 | **13.3** |

Bold marks the best result per row. Jota beats Solid in the first and fifth rows, and loses to Solid in the other four.

## How to read this

- Jota is in the same range as Solid: faster in two scenarios, about 1.0x to 2x slower in the others. Preact Signals is clearly faster than both (roughly 2.5x to 5x faster than Jota here).
- These are micro-benchmarks of the **reactive graph only**, in Node. They include no DOM, no rendering and no browser, so they say nothing about real page performance, bundle size, or memory.
- They are not a React comparison: React has no fine-grained reactivity to compare in this setup.
- Numbers move between runs and machines. Treat differences under ~20% as noise.
- A first version of this benchmark was wrong for Solid: effects created inside `createRoot` do not run until the root function returns, so writes happened with no subscribers. The scenarios now build the graph inside the root and run the measured work afterwards.
- Before the allocation fixes in `packages/core/src/reactive.ts` (no array copies in the notify loops, a queue without `Array.shift`), Jota was 1.1x to 6x slower than Solid.

Possible next optimizations: avoid re-subscribing sources on every effect run when dependencies did not change, and cheaper notification for effects with a single source.
