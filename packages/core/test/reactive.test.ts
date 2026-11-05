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
    setOuter(1); // old inner effect disposed, new one created
    expect(innerRuns).toHaveBeenCalledTimes(2);
    setInner(1); // only the new inner effect reacts
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
    setN(3); // parity still 1
    expect(run).toHaveBeenCalledTimes(1);
    setN(4); // parity 0
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
