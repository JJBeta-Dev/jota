import { describe, expect, it, vi } from "vitest";
import { batch, computed, createRoot, effect, onCleanup, signal, untrack } from "../src/reactive.js";

describe("signal", () => {
  it("reads and writes values", () => {
    const [count, setCount] = signal(1);
    expect(count()).toBe(1);
    setCount(2);
    expect(count()).toBe(2);
    setCount((n) => n + 1);
    expect(count()).toBe(3);
  });

  it("does not notify when the value is equal", () => {
    const [value, setValue] = signal(1);
    const run = vi.fn();
    effect(() => run(value()));
    setValue(1);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("notifies on equal values when equals is false", () => {
    const [value, setValue] = signal(1, { equals: false });
    const run = vi.fn();
    effect(() => run(value()));
    setValue(1);
    expect(run).toHaveBeenCalledTimes(2);
  });
});

describe("effect", () => {
  it("runs immediately and again on change", () => {
    const [count, setCount] = signal(0);
    const seen: number[] = [];
    effect(() => seen.push(count()));
    setCount(1);
    setCount(2);
    expect(seen).toEqual([0, 1, 2]);
  });

  it("only re-runs for signals it actually read", () => {
    const [a, setA] = signal(1);
    const [b, setB] = signal(1);
    const run = vi.fn();
    effect(() => run(a()));
    setB(2);
    expect(run).toHaveBeenCalledTimes(1);
    setA(2);
    expect(run).toHaveBeenCalledTimes(2);
    void b;
  });

  it("tracks dependencies dynamically", () => {
    const [flag, setFlag] = signal(true);
    const [a, setA] = signal("a");
    const [b, setB] = signal("b");
    const run = vi.fn();
    effect(() => run(flag() ? a() : b()));
    setB("b2");
    expect(run).toHaveBeenCalledTimes(1);
    setFlag(false);
    expect(run).toHaveBeenCalledTimes(2);
    setA("a2");
    expect(run).toHaveBeenCalledTimes(2);
    setB("b3");
    expect(run).toHaveBeenCalledTimes(3);
  });

  it("passes the previous return value", () => {
    const [n, setN] = signal(1);
    const history: Array<number | undefined> = [];
    effect<number>((previous) => {
      history.push(previous);
      return n();
    });
    setN(2);
    setN(3);
    expect(history).toEqual([undefined, 1, 2]);
  });

  it("stops after dispose", () => {
    const [n, setN] = signal(0);
    const run = vi.fn();
    const dispose = effect(() => run(n()));
    dispose();
    setN(1);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("runs onCleanup before each re-run and on dispose", () => {
    const [n, setN] = signal(0);
    const cleanup = vi.fn();
    const dispose = effect(() => {
      n();
      onCleanup(cleanup);
    });
    setN(1);
    expect(cleanup).toHaveBeenCalledTimes(1);
    dispose();
    expect(cleanup).toHaveBeenCalledTimes(2);
  });

  it("disposes nested effects when the parent re-runs", () => {
    const [outer, setOuter] = signal(0);
    const [inner, setInner] = signal(0);
    const innerRuns = vi.fn();
    effect(() => {
      outer();
      effect(() => innerRuns(inner()));
    });
    expect(innerRuns).toHaveBeenCalledTimes(1);
    setOuter(1); /* old inner effect disposed, new one created */
    expect(innerRuns).toHaveBeenCalledTimes(2);
    setInner(1); /* only the new inner effect reacts */
    expect(innerRuns).toHaveBeenCalledTimes(3);
  });

  it("detects infinite loops instead of hanging", () => {
    const [n, setN] = signal(0);
    expect(() => effect(() => setN(n() + 1))).toThrow(/infinite update loop/);
  });
});

describe("computed", () => {
  it("derives and caches values", () => {
    const [n, setN] = signal(2);
    const compute = vi.fn(() => n() * 2);
    const double = computed(compute);
    expect(double()).toBe(4);
    expect(double()).toBe(4);
    expect(compute).toHaveBeenCalledTimes(1);
    setN(3);
    expect(double()).toBe(6);
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it("does not re-run dependents when the derived value is unchanged", () => {
    const [n, setN] = signal(1);
    const parity = computed(() => n() % 2);
    const run = vi.fn();
    effect(() => run(parity()));
    setN(3); /* parity still 1 */
    expect(run).toHaveBeenCalledTimes(1);
    setN(4); /* parity 0 */
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("chains computeds without glitches (diamond)", () => {
    const [n, setN] = signal(1);
    const double = computed(() => n() * 2);
    const triple = computed(() => n() * 3);
    const seen: number[] = [];
    effect(() => seen.push(double() + triple()));
    setN(2);
    expect(seen).toEqual([5, 10]);
  });

  it("works with memo of memo", () => {
    const [n, setN] = signal(1);
    const a = computed(() => n() + 1);
    const b = computed(() => a() * 10);
    expect(b()).toBe(20);
    setN(2);
    expect(b()).toBe(30);
  });
});

describe("batch", () => {
  it("runs effects once after several writes", () => {
    const [a, setA] = signal(1);
    const [b, setB] = signal(1);
    const run = vi.fn();
    effect(() => run(a() + b()));
    batch(() => {
      setA(2);
      setB(2);
    });
    expect(run).toHaveBeenCalledTimes(2);
    expect(run).toHaveBeenLastCalledWith(4);
  });

  it("returns the callback value and supports nesting", () => {
    const [a, setA] = signal(0);
    const run = vi.fn();
    effect(() => run(a()));
    const result = batch(() => {
      batch(() => setA(1));
      setA(2);
      return "done";
    });
    expect(result).toBe("done");
    expect(run).toHaveBeenCalledTimes(2);
  });
});

describe("untrack", () => {
  it("reads without subscribing", () => {
    const [a, setA] = signal(1);
    const [b, setB] = signal(1);
    const run = vi.fn();
    effect(() => run(a() + untrack(b)));
    setB(2);
    expect(run).toHaveBeenCalledTimes(1);
    setA(2);
    expect(run).toHaveBeenCalledTimes(2);
    expect(run).toHaveBeenLastCalledWith(4);
  });
});

describe("createRoot", () => {
  it("disposes everything created inside", () => {
    const [n, setN] = signal(0);
    const run = vi.fn();
    const dispose = createRoot((dispose) => {
      effect(() => run(n()));
      return dispose;
    });
    setN(1);
    expect(run).toHaveBeenCalledTimes(2);
    dispose();
    setN(2);
    expect(run).toHaveBeenCalledTimes(2);
  });
});

describe("dependency tracking when sources change between runs", () => {
  it("follows a conditional branch and drops the source it stopped reading", () => {
    const [flag, setFlag] = signal(true);
    const [a, setA] = signal(1);
    const [b, setB] = signal(10);
    const seen: number[] = [];
    effect(() => void seen.push(flag() ? a() : b()));
    expect(seen).toEqual([1]);

    setA(2);
    expect(seen).toEqual([1, 2]);
    setFlag(false);
    expect(seen).toEqual([1, 2, 10]);
    setA(3); /* no longer read: must not re-run */
    expect(seen).toEqual([1, 2, 10]);
    setB(11);
    expect(seen).toEqual([1, 2, 10, 11]);
    setFlag(true);
    setB(12); /* b was dropped again */
    expect(seen).toEqual([1, 2, 10, 11, 3]);
  });

  it("handles sources read in a different order and read twice", () => {
    const [a, setA] = signal(1);
    const [b, setB] = signal(2);
    const [swap, setSwap] = signal(false);
    const runs = vi.fn();
    effect(() => {
      runs();
      if (swap()) {
        b();
        a();
        a();
      } else {
        a();
        a();
        b();
      }
    });
    expect(runs).toHaveBeenCalledTimes(1);
    setSwap(true);
    expect(runs).toHaveBeenCalledTimes(2);
    setA(5);
    expect(runs).toHaveBeenCalledTimes(3);
    setB(6);
    expect(runs).toHaveBeenCalledTimes(4);
    setSwap(false);
    setA(7);
    setB(8);
    expect(runs).toHaveBeenCalledTimes(7);
  });

  it("keeps a source that moved to a later position", () => {
    const [a, setA] = signal(0);
    const [b, setB] = signal(0);
    const [c, setC] = signal(0);
    const [mode, setMode] = signal(0);
    const runs = vi.fn();
    effect(() => {
      runs();
      if (mode() === 0) {
        a();
        b();
      } else {
        c();
        a();
        b();
      }
    });
    setMode(1);
    runs.mockClear();
    setA(1);
    setB(1);
    setC(1);
    expect(runs).toHaveBeenCalledTimes(3);
  });

  it("shrinks the list of sources and still reacts to the ones that remain", () => {
    const [count, setCount] = signal(3);
    const sources = [signal(0), signal(0), signal(0)];
    const runs = vi.fn();
    effect(() => {
      runs();
      for (let i = 0; i < count(); i++) (sources[i] as ReturnType<typeof signal<number>>)[0]();
    });
    setCount(1);
    runs.mockClear();
    (sources[2] as ReturnType<typeof signal<number>>)[1](1); /* dropped */
    expect(runs).toHaveBeenCalledTimes(0);
    (sources[0] as ReturnType<typeof signal<number>>)[1](1); /* still read */
    expect(runs).toHaveBeenCalledTimes(1);
  });

  it("works for computeds whose sources change", () => {
    const [useA, setUseA] = signal(true);
    const [a, setA] = signal(1);
    const [b, setB] = signal(100);
    const picked = computed(() => (useA() ? a() : b()));
    const seen: number[] = [];
    effect(() => void seen.push(picked()));
    setA(2);
    setUseA(false);
    setA(3); /* dropped */
    setB(101);
    expect(seen).toEqual([1, 2, 100, 101]);
  });

  it("handles many sources, more than the linear search limit", () => {
    const signals = Array.from({ length: 40 }, () => signal(0));
    const [limit, setLimit] = signal(40);
    const runs = vi.fn();
    effect(() => {
      runs();
      for (let i = 0; i < limit(); i++) (signals[i] as ReturnType<typeof signal<number>>)[0]();
    });
    setLimit(30);
    runs.mockClear();
    (signals[35] as ReturnType<typeof signal<number>>)[1](1); /* dropped */
    expect(runs).toHaveBeenCalledTimes(0);
    (signals[29] as ReturnType<typeof signal<number>>)[1](1); /* kept */
    expect(runs).toHaveBeenCalledTimes(1);
  });

  it("does not stay subscribed when an effect is disposed during one of its runs", () => {
    const [a, setA] = signal(0);
    const runs = vi.fn();
    let stopNow = false;
    let stop = () => {};
    stop = effect(() => {
      runs();
      a();
      if (stopNow) stop();
    });
    stopNow = true;
    setA(1); /* second run disposes itself */
    expect(runs).toHaveBeenCalledTimes(2);
    setA(2);
    setA(3);
    expect(runs).toHaveBeenCalledTimes(2);
  });
});

describe("ownership of many children", () => {
  it("disposes children in any order, then the parent, running each cleanup exactly once", () => {
    const cleanups: number[] = [];
    const stops: Array<() => void> = [];
    const dispose = createRoot((dispose) => {
      for (let i = 0; i < 6; i++) {
        stops.push(
          effect(() => {
            onCleanup(() => void cleanups.push(i));
          }),
        );
      }
      return dispose;
    });
    /* Remove from the middle, the end and the start (exercises the swap with the last child). */
    (stops[2] as () => void)();
    (stops[5] as () => void)();
    (stops[0] as () => void)();
    expect(cleanups.sort()).toEqual([0, 2, 5]);
    dispose();
    expect(cleanups.sort()).toEqual([0, 1, 2, 3, 4, 5]);
    dispose();
    expect(cleanups).toHaveLength(6);
  });

  it("lets a child dispose itself while its parent re-runs", () => {
    const [n, setN] = signal(0);
    const cleaned = vi.fn();
    effect(() => {
      n();
      const stop = effect(() => onCleanup(cleaned));
      stop();
    });
    setN(1);
    setN(2);
    expect(cleaned).toHaveBeenCalledTimes(3);
  });
});
