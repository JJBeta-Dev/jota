// Reactivity micro-benchmarks. Same scenarios, same logic, three libraries.
// Run `pnpm --filter jota-bench bench` after `pnpm -r build`.
// This measures the reactive graph only, in Node, with no DOM and no browser.
import { readFileSync } from "node:fs";
import os from "node:os";
import * as jota from "jota-js";
// The default "solid-js" entry in Node is the server build (no reactivity), so import the client build.
import * as solid from "solid-js/dist/solid.js";
import * as preact from "@preact/signals-core";

const libs = {
  jota: {
    name: "Jota",
    signal: (value) => {
      const [get, set] = jota.signal(value);
      return { get, set };
    },
    computed: (fn) => jota.computed(fn),
    effect: (fn) => void jota.effect(fn),
    batch: (fn) => jota.batch(fn),
    root: (fn) => jota.createRoot(fn),
  },
  solid: {
    name: "Solid",
    signal: (value) => {
      const [get, set] = solid.createSignal(value, { equals: (a, b) => a === b });
      return { get, set: (v) => set(() => v) };
    },
    computed: (fn) => solid.createMemo(fn),
    effect: (fn) => solid.createEffect(fn),
    batch: (fn) => solid.batch(fn),
    root: (fn) => solid.createRoot(fn),
  },
  preact: {
    name: "Preact Signals",
    signal: (value) => {
      const s = preact.signal(value);
      return { get: () => s.value, set: (v) => void (s.value = v) };
    },
    computed: (fn) => {
      const c = preact.computed(fn);
      return () => c.value;
    },
    effect: (fn) => void preact.effect(fn),
    batch: (fn) => preact.batch(fn),
    root: (fn) => fn(() => {}),
  },
};

// Each scenario builds its graph inside a root (so effects exist and are subscribed: Solid only runs
// effects created in a root once the root function returns) and returns a function that performs
// and times the measured work afterwards.
const scenarios = [
  {
    title: "1,000,000 writes to one signal read by one effect",
    run: (lib) =>
      lib.root(() => {
        const s = lib.signal(0);
        let sink = 0;
        lib.effect(() => void (sink += s.get()));
        return () => {
          const start = performance.now();
          for (let i = 1; i <= 1_000_000; i++) s.set(i);
          return performance.now() - start;
        };
      }),
  },
  {
    title: "Chain of 1,000 computeds, 1,000 updates",
    run: (lib) =>
      lib.root(() => {
        const s = lib.signal(0);
        let previous = s.get;
        for (let i = 0; i < 1000; i++) {
          const before = previous;
          previous = lib.computed(() => before() + 1);
        }
        let sink = 0;
        const last = previous;
        lib.effect(() => void (sink += last()));
        return () => {
          const start = performance.now();
          for (let i = 1; i <= 1000; i++) s.set(i);
          return performance.now() - start;
        };
      }),
  },
  {
    title: "Fan-out: one signal read by 10,000 effects, 100 updates",
    run: (lib) =>
      lib.root(() => {
        const s = lib.signal(0);
        let sink = 0;
        for (let i = 0; i < 10_000; i++) lib.effect(() => void (sink += s.get()));
        return () => {
          const start = performance.now();
          for (let i = 1; i <= 100; i++) s.set(i);
          return performance.now() - start;
        };
      }),
  },
  {
    title: "Diamond: one signal, 1,000 computeds, one sum, 1,000 updates",
    run: (lib) =>
      lib.root(() => {
        const s = lib.signal(0);
        const parts = Array.from({ length: 1000 }, (_, i) => lib.computed(() => s.get() + i));
        const sum = lib.computed(() => parts.reduce((total, part) => total + part(), 0));
        let sink = 0;
        lib.effect(() => void (sink += sum()));
        return () => {
          const start = performance.now();
          for (let i = 1; i <= 1000; i++) s.set(i);
          return performance.now() - start;
        };
      }),
  },
  {
    title: "Batch: 10 signals written together, one effect, 50,000 batches",
    run: (lib) =>
      lib.root(() => {
        const signals = Array.from({ length: 10 }, () => lib.signal(0));
        let sink = 0;
        lib.effect(() => void (sink += signals.reduce((total, s) => total + s.get(), 0)));
        return () => {
          const start = performance.now();
          for (let n = 1; n <= 50_000; n++) {
            lib.batch(() => {
              for (const s of signals) s.set(n);
            });
          }
          return performance.now() - start;
        };
      }),
  },
  {
    title: "Create 100,000 signals and 100,000 computeds",
    run: (lib) =>
      lib.root(() => {
        const start = performance.now();
        const signals = [];
        const computeds = [];
        for (let i = 0; i < 100_000; i++) {
          const s = lib.signal(i);
          signals.push(s);
          computeds.push(lib.computed(() => s.get() * 2));
        }
        const elapsed = performance.now() - start;
        return () => elapsed;
      }),
  },
];

const RUNS = 7;
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

const results = [];
for (const scenario of scenarios) {
  const row = { title: scenario.title, times: {} };
  for (const [key, lib] of Object.entries(libs)) {
    scenario.run(lib)(); // warm up
    const times = [];
    for (let i = 0; i < RUNS; i++) times.push(scenario.run(lib)());
    row.times[key] = median(times);
  }
  results.push(row);
}

const versionOf = (name) =>
  JSON.parse(readFileSync(new URL(`./node_modules/${name}/package.json`, import.meta.url), "utf8")).version;
const solidVersion = versionOf("solid-js");
const preactVersion = versionOf("@preact/signals-core");

console.log(`Node ${process.version} on ${os.cpus()[0]?.model ?? "unknown CPU"} (${os.platform()})`);
console.log(`Solid ${solidVersion}, Preact Signals ${preactVersion}. Median of ${RUNS} runs, milliseconds, lower is better.\n`);
console.log("| Scenario | Jota | Solid | Preact Signals |");
console.log("|---|---:|---:|---:|");
for (const row of results) {
  const best = Math.min(...Object.values(row.times));
  const cell = (key) => {
    const value = row.times[key];
    const text = value >= 100 ? value.toFixed(0) : value.toFixed(1);
    return value === best ? `**${text}**` : text;
  };
  console.log(`| ${row.title} | ${cell("jota")} | ${cell("solid")} | ${cell("preact")} |`);
}
