import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { signal } from "../src/reactive.js";
import { Island, startIslands } from "../src/island.js";
import { hydrate, insert, render, setMarking, template } from "../src/web.js";

/* Hand-written equivalent of what the compiler emits for <button>Count: {count()}</button>. */
const buttonTemplate = template("<button></button>");
function Counter(props: { start: number }): Node {
  const [count, setCount] = signal(props.start);
  const button = buttonTemplate() as HTMLButtonElement;
  button.addEventListener("click", () => setCount(count() + 1));
  insert(button, () => `Count: ${count()}`);
  return button;
}

/* <section><h2>Title</h2><p>{text}</p><Counter /></section> */
const sectionTemplate = template("<section><h2>Title</h2><p></p></section>");
function Section(): Node {
  const section = sectionTemplate() as HTMLElement;
  insert(section.querySelector("p") as HTMLElement, () => "Some text");
  insert(section, () => Counter({ start: 7 }));
  return section;
}

let container: HTMLElement;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const registry = { "/src/islands/Counter.tsx": () => ({ default: Counter }) };

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  container.remove();
  setMarking(null);
});

/** What the build does: render the island with marking on and keep the HTML. */
function buildIslandHtml(): string {
  const host = document.createElement("div");
  setMarking("islands");
  const unmount = render(() => Island({ name: "Counter", component: Counter, props: { start: 3 }, load: "load" }), host);
  setMarking(null);
  const html = host.innerHTML;
  unmount();
  return html;
}

describe("marking at build time", () => {
  it("marks elements and dynamic spots inside an island only", () => {
    const html = buildIslandHtml();
    expect(html).toMatch(/<button data-hk="0\.[a-z0-9]+">/);
    expect(html).toContain("<!--[0-->");
    expect(html).toContain("<!--]0-->");
    expect(html).toContain("Count: 3");
  });

  it("marks nothing when marking is off", () => {
    const host = document.createElement("div");
    render(() => Counter({ start: 1 }), host);
    expect(host.innerHTML).not.toContain("data-hk");
    expect(host.innerHTML).not.toContain("<!--");
  });

  it("marks everything on a page in page mode", () => {
    const host = document.createElement("div");
    setMarking("page");
    render(() => Section(), host);
    setMarking(null);
    expect(host.querySelectorAll("[data-hk]").length).toBe(2); /* section and button */
  });
});

describe("hydrating an island", () => {
  it("keeps the server elements and makes them interactive", async () => {
    container.innerHTML = buildIslandHtml();
    const serverButton = container.querySelector("button") as HTMLButtonElement;
    const serverText = Array.from(serverButton.childNodes).find((node) => node.nodeType === 3);

    startIslands(registry, container);
    await flush();

    const button = container.querySelector("button") as HTMLButtonElement;
    expect(button).toBe(serverButton); /* not rebuilt */
    expect(container.querySelectorAll("button")).toHaveLength(1);
    expect(button.hasAttribute("data-hk")).toBe(false);
    expect(button.textContent).toBe("Count: 3");
    expect(Array.from(button.childNodes).filter((node) => node.nodeType === 3)).toEqual([serverText]); /* the text node was adopted too */

    button.click();
    expect(button.textContent).toBe("Count: 4");
    button.click();
    expect(button.textContent).toBe("Count: 5");
    expect(button).toBe(container.querySelector("button"));
  });

  it("keeps focus and typed text without any restore step", async () => {
    function Field(): Node {
      const [value, setValue] = signal("");
      const wrapper = fieldTemplate() as HTMLElement;
      const input = wrapper.firstChild as HTMLInputElement;
      input.addEventListener("input", () => setValue(input.value));
      insert(wrapper.lastChild as HTMLElement, () => `Typed: ${value()}`);
      return wrapper;
    }
    const fieldTemplate = template("<div><input><p></p></div>");
    const host = document.createElement("div");
    setMarking("islands");
    render(() => Island({ name: "Field", component: Field, load: "load" }), host);
    setMarking(null);
    container.innerHTML = host.innerHTML;

    const input = container.querySelector("input") as HTMLInputElement;
    input.value = "abc";
    input.focus();

    startIslands({ "/src/islands/Field.tsx": () => ({ default: Field }) }, container);
    await flush();

    expect(container.querySelector("input")).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe("abc");
    input.value = "abcd";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(container.querySelector("p")?.textContent).toBe("Typed: abcd");
  });

  it("falls back to mounting from scratch when the markup does not match", async () => {
    container.innerHTML = buildIslandHtml().replace(/data-hk="0\.[a-z0-9]+"/, 'data-hk="0.zzzz"');
    const serverButton = container.querySelector("button") as HTMLButtonElement;

    startIslands(registry, container);
    await flush();

    const button = container.querySelector("button") as HTMLButtonElement;
    expect(container.querySelectorAll("button")).toHaveLength(1);
    expect(button).not.toBe(serverButton); /* rebuilt */
    button.click();
    expect(button.textContent).toBe("Count: 4");
  });

  it("falls back when the HTML was not marked at all", async () => {
    container.innerHTML =
      '<div data-jota-island="Counter" data-jota-load="load" data-jota-props=\'{"start":3}\'><button>Count: 3</button></div>';
    startIslands(registry, container);
    await flush();
    const button = container.querySelector("button") as HTMLButtonElement;
    button.click();
    expect(button.textContent).toBe("Count: 4");
    expect(container.querySelectorAll("button")).toHaveLength(1);
  });
});

describe("hydrate()", () => {
  it("hydrates a whole page: nested templates and spots line up", () => {
    const host = document.createElement("div");
    setMarking("page");
    render(() => Section(), host);
    setMarking(null);
    container.innerHTML = host.innerHTML;
    const [section, button] = [container.querySelector("section"), container.querySelector("button")] as [HTMLElement, HTMLButtonElement];
    const heading = container.querySelector("h2");

    const unmount = hydrate(() => Section(), container);
    expect(unmount).not.toBeNull();
    expect(container.querySelector("section")).toBe(section);
    expect(container.querySelector("h2")).toBe(heading);
    expect(container.querySelector("button")).toBe(button);
    expect(container.querySelectorAll("section")).toHaveLength(1);
    expect(container.textContent).toBe("TitleSome textCount: 7");
    button.click();
    expect(button.textContent).toBe("Count: 8");
    unmount?.();
    expect(container.innerHTML).toBe("");
  });

  it("returns null and leaves the HTML alone when a different component is hydrated", () => {
    const host = document.createElement("div");
    setMarking("page");
    render(() => Section(), host);
    setMarking(null);
    container.innerHTML = host.innerHTML;
    /* A page that builds something else cannot claim these nodes. */
    const other = template("<article>Other</article>");
    expect(hydrate(() => other(), container)).toBeNull();
  });
});
