import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signal } from "../src/reactive.js";
import { insert } from "../src/web.js";

let parent: HTMLElement;

const nodes = Array.from({ length: 12 }, (_, i) => {
  const element = document.createElement("i");
  element.textContent = String(i);
  return element;
});
const text = () => [...parent.childNodes].map((node) => node.textContent).join(",");
const make = (order: number[]) => order.map((i) => nodes[i] as Node);

beforeEach(() => {
  parent = document.createElement("div");
  document.body.appendChild(parent);
});

afterEach(() => {
  parent.remove();
});

function setup(initial: number[]) {
  const [list, setList] = signal<Node[]>(make(initial));
  insert(parent, list);
  return (order: number[]) => setList(make(order));
}

describe("array reconciliation", () => {
  it("renders, appends, prepends, removes and clears", () => {
    const set = setup([0, 1, 2]);
    expect(text()).toBe("0,1,2");
    set([0, 1, 2, 3]);
    expect(text()).toBe("0,1,2,3");
    set([9, 0, 1, 2, 3]);
    expect(text()).toBe("9,0,1,2,3");
    set([0, 2, 3]);
    expect(text()).toBe("0,2,3");
    set([]);
    expect(text()).toBe("");
    set([4, 5]);
    expect(text()).toBe("4,5");
  });

  it("reuses the same nodes when only the order changes", () => {
    const set = setup([0, 1, 2, 3]);
    const before = [...parent.childNodes];
    set([3, 2, 1, 0]);
    expect(text()).toBe("3,2,1,0");
    expect([...parent.childNodes]).toEqual([...before].reverse());
  });

  it("moves only two nodes when two rows are swapped", () => {
    const set = setup([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const spy = vi.spyOn(parent, "insertBefore");
    set([0, 8, 2, 3, 4, 5, 6, 7, 1, 9]);
    expect(text()).toBe("0,8,2,3,4,5,6,7,1,9");
    expect(spy.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it("moves a single node when one row jumps to the front", () => {
    const set = setup([0, 1, 2, 3, 4, 5]);
    const spy = vi.spyOn(parent, "insertBefore");
    set([5, 0, 1, 2, 3, 4]);
    expect(text()).toBe("5,0,1,2,3,4");
    expect(spy.mock.calls.length).toBe(1);
  });

  it("ends up in the right order for many random changes", () => {
    let seed = 7;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const set = setup([0, 1, 2, 3, 4, 5]);
    for (let round = 0; round < 200; round++) {
      const pool = [...Array(12).keys()].sort(() => random() - 0.5);
      const order = pool.slice(0, Math.floor(random() * 13));
      set(order);
      expect(text()).toBe(order.join(","));
    }
  });

  it("keeps static siblings and respects the marker", () => {
    const marker = document.createTextNode("|");
    parent.append("a-", marker, "-z");
    const [list, setList] = signal<Node[]>(make([0, 1]));
    insert(parent, list, marker);
    expect(parent.textContent).toBe("a-01|-z");
    setList(make([1, 2, 0]));
    expect(parent.textContent).toBe("a-120|-z");
    setList([]);
    expect(parent.textContent).toBe("a-|-z");
  });
});
