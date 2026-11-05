import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render } from "jota-js";
import { transformJota } from "../src/index.js";
import { Counter, calls } from "./fixtures/Counter.js";
import { Features, controls } from "./fixtures/Features.js";

let container: HTMLElement;
let unmount: (() => void) | undefined;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  unmount?.();
  unmount = undefined;
  container.remove();
});

describe("compiler output", () => {
  it("removes JSX and TypeScript, and imports from the Jota runtime", async () => {
    const result = await transformJota('const x: number = 1; export const a = <p class="c">{x}</p>;', "a.tsx");
    expect(result?.code).toContain("jota-js/web");
    // The element became a cloned template (static HTML inside a string), not JSX.
    expect(result?.code).toContain("_$template(`<p class=c>");
    expect(result?.code).toContain("export const a = _tmpl$();");
    expect(result?.code).not.toContain(": number");
  });

  it("ignores files that are not jsx/tsx or live in node_modules", async () => {
    expect(await transformJota("export const a = 1;", "a.ts")).toBeNull();
    expect(await transformJota("export const a = <p/>;", "/x/node_modules/pkg/a.tsx")).toBeNull();
  });

  it("compiles .jsx files without TypeScript", async () => {
    const result = await transformJota("export const a = <p>{1}</p>;", "a.jsx");
    expect(result?.code).toContain("jota-js/web");
  });
});

describe("fine-grained updates (Counter)", () => {
  it("renders, and a click updates only the text node", () => {
    calls.counter = 0;
    unmount = render(() => <Counter label="Demo" />, container);

    const paragraph = container.querySelector("p") as HTMLElement;
    const heading = container.querySelector("h2") as HTMLElement;
    const textNodeBefore = paragraph.lastChild;
    expect(paragraph.textContent).toBe("Clicks: 0");

    (container.querySelector("button") as HTMLButtonElement).click();
    (container.querySelector("button") as HTMLButtonElement).click();

    expect(paragraph.textContent).toBe("Clicks: 2");
    // Same elements and same text node: nothing was re-created.
    expect(container.querySelector("p")).toBe(paragraph);
    expect(container.querySelector("h2")).toBe(heading);
    expect(paragraph.lastChild).toBe(textNodeBefore);
  });

  it("runs the component function only once, however many updates happen", () => {
    calls.counter = 0;
    unmount = render(() => <Counter label="Demo" />, container);
    for (let i = 0; i < 5; i++) (container.querySelector("button") as HTMLButtonElement).click();
    expect(calls.counter).toBe(1);
    expect(container.querySelector("p")?.textContent).toBe("Clicks: 5");
  });

  it("stops updating after unmount", () => {
    unmount = render(() => <Counter label="Demo" />, container);
    const button = container.querySelector("button") as HTMLButtonElement;
    unmount();
    unmount = undefined;
    expect(container.innerHTML).toBe("");
    button.click(); // listener still attached to the detached node, but nothing updates the page
    expect(container.innerHTML).toBe("");
  });
});

describe("features", () => {
  beforeEach(() => {
    unmount = render(() => <Features />, container);
  });

  it("applies attributes, classes, styles and refs, and keeps them reactive", () => {
    const root = container.querySelector("#root") as HTMLElement;
    expect(controls.refEl).toBe(root);
    expect(root.getAttribute("data-name")).toBe("Ada");
    expect(root.classList.contains("base")).toBe(true);
    expect(root.classList.contains("active")).toBe(false);
    expect(root.style.color).toBe("red");

    controls.setOn(true);
    controls.setColor("blue");
    controls.setName("Grace");

    expect(root.classList.contains("active")).toBe(true);
    expect(root.classList.contains("base")).toBe(true);
    expect(root.style.color).toBe("blue");
    expect(root.getAttribute("data-name")).toBe("Grace");
  });

  it("toggles Show content and fallback", () => {
    expect(container.querySelector("#off")).not.toBeNull();
    expect(container.querySelector("#on")).toBeNull();
    controls.setOn(true);
    expect(container.querySelector("#off")).toBeNull();
    expect(container.querySelector("#on")?.textContent).toBe("on");
    controls.setOn(false);
    expect(container.querySelector("#off")).not.toBeNull();
  });

  it("renders lists and reuses the DOM nodes of unchanged items", () => {
    const text = () => [...container.querySelectorAll("li")].map((li) => li.textContent);
    expect(text()).toEqual(["0:a", "1:b", "2:c"]);
    const [a, b, c] = [...container.querySelectorAll("li")];

    controls.setItems(["z", "a", "b", "c"]);
    expect(text()).toEqual(["0:z", "1:a", "2:b", "3:c"]);
    const after = [...container.querySelectorAll("li")];
    expect(after[1]).toBe(a);
    expect(after[2]).toBe(b);
    expect(after[3]).toBe(c);

    controls.setItems(["c", "a"]);
    expect(text()).toEqual(["0:c", "1:a"]);
    expect(container.querySelectorAll("li")[0]).toBe(c);
  });

  it("switches conditional expressions between elements and text", () => {
    const output = container.querySelector("output") as HTMLElement;
    expect(output.textContent).toBe("small");
    controls.setBig(true);
    expect(output.innerHTML).toBe("<b>BIG</b>");
    controls.setBig(false);
    expect(output.textContent).toBe("small");
  });

  it("passes reactive props and children through components", () => {
    expect(container.querySelector("h3")?.textContent).toBe("ADA");
    controls.setName("Linus");
    expect(container.querySelector("h3")?.textContent).toBe("LINUS");

    const tag = container.querySelector("article span") as HTMLElement;
    expect(tag.className).toBe("plain");
    controls.setBig(true);
    expect(tag.className).toBe("strong");
  });
});
