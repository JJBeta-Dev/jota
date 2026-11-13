import { afterEach, describe, expect, it } from "vitest";
import { batch, computed, createRoot, effect, signal } from "../src/index.js";
import { startDevtools, type Devtools } from "../src/devtools.js";

let devtools: Devtools | undefined;
afterEach(() => devtools?.stop());

describe("jota-js/devtools", () => {
  it("counts writes by name and the computeds and effects they cause", () => {
    const [count, setCount] = signal(0, { name: "count" });
    const [other, setOther] = signal(0);
    const double = createRoot(() => {
      const value = computed(() => count() * 2);
      effect(() => void value());
      effect(() => void other());
      return value;
    });
    devtools = startDevtools();

    const click = devtools.measure(() => setCount(1));
    expect(click).toEqual({ writes: { count: 1 }, computed: 1, effects: 1 });
    expect(double()).toBe(2);

    const both = devtools.measure(() =>
      batch(() => {
        setCount(2);
        setOther(1);
      }),
    );
    expect(both).toEqual({ writes: { count: 1, "(unnamed)": 1 }, computed: 1, effects: 2 });
    expect(devtools.summary().effects).toBe(3);
    expect((globalThis as { __JOTA_DEVTOOLS__?: Devtools }).__JOTA_DEVTOOLS__).toBe(devtools);
  });

  it("records nothing for a write that does not change the value, keeps a limit, and stops", () => {
    const [value, setValue] = signal(1, { name: "value" });
    devtools = startDevtools({ limit: 3 });
    setValue(1);
    expect(devtools.events).toHaveLength(0);
    for (let i = 2; i < 10; i++) setValue(i);
    expect(devtools.events).toHaveLength(3);
    devtools.clear();
    devtools.stop();
    setValue(100);
    expect(devtools.events).toHaveLength(0);
    expect(value()).toBe(100);
  });
});
