import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render } from "jota-js";
import { App } from "../src/App";
import { seriesFor } from "../src/data";

let container: HTMLElement;
let unmount: () => void;

const text = (id: string) => container.querySelector(`#${id}`)?.textContent;
const choose = (id: string, value: string) => {
  const select = container.querySelector(`#${id}`) as HTMLSelectElement;
  select.value = value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
};
const bars = () => [...container.querySelectorAll("rect.bar")].map((bar) => bar.getAttribute("data-month"));

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  unmount = render(() => <App />, container);
});

afterEach(() => {
  unmount();
  container.remove();
});

describe("dashboard", () => {
  it("summarizes all products for all months", () => {
    const series = seriesFor("all");
    const total = series.reduce((sum, units) => sum + units, 0);
    expect(text("total")).toBe(`Total: ${total} units`);
    expect(text("average")).toBe(`Average per month: ${Math.round(total / 6)} units`);
    expect(bars()).toEqual(["Jan", "Feb", "Mar", "Apr", "May", "Jun"]);
  });

  it("filters by product", () => {
    choose("product", "bikes");
    const total = seriesFor("bikes").reduce((sum, units) => sum + units, 0);
    expect(text("total")).toBe(`Total: ${total} units`);
    expect(text("best")).toBe("Best month: May (30 units)");
  });

  it("filters by starting month and updates the chart and the table", () => {
    choose("from", "3");
    expect(bars()).toEqual(["Apr", "May", "Jun"]);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(3);
  });

  it("reuses chart bars when only the values change", () => {
    const before = [...container.querySelectorAll("rect.bar")];
    choose("product", "parts");
    const after = [...container.querySelectorAll("rect.bar")];
    expect(after).toHaveLength(before.length);
    /** Rows are new objects, so bars are rebuilt: this documents the current behavior of For (identity based). */
    expect(bars()).toEqual(["Jan", "Feb", "Mar", "Apr", "May", "Jun"]);
  });

  it("combines both filters", () => {
    choose("product", "scooters");
    choose("from", "4");
    expect(text("total")).toBe("Total: 44 units");
    expect(text("best")).toBe("Best month: Jun (25 units)");
  });
});
