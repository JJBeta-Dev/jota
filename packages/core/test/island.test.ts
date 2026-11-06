import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signal } from "../src/reactive.js";
import { render } from "../src/web.js";
import { Island, startIslands } from "../src/island.js";

function Counter(props: { start: number }): Node {
  const [count, setCount] = signal(props.start);
  const button = document.createElement("button");
  button.addEventListener("click", () => setCount(count() + 1));
  render(() => () => `Count: ${count()}`, button);
  return button;
}

let container: HTMLElement;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  container.remove();
  vi.restoreAllMocks();
});

const renderIsland = (load?: "load" | "idle" | "visible") => {
  return render(
    () => Island({ name: "Counter", component: Counter, props: { start: 5 }, ...(load ? { load } : {}) }),
    container,
  );
};

describe("<Island>", () => {
  it("renders the component and records its name, props and load mode", () => {
    renderIsland("idle");
    const wrapper = container.querySelector("[data-jota-island]") as HTMLElement;
    expect(wrapper.getAttribute("data-jota-island")).toBe("Counter");
    expect(wrapper.getAttribute("data-jota-load")).toBe("idle");
    expect(JSON.parse(wrapper.getAttribute("data-jota-props") as string)).toEqual({ start: 5 });
    expect(wrapper.textContent).toBe("Count: 5");
  });

  it("defaults to loading when visible", () => {
    renderIsland();
    expect(container.querySelector("[data-jota-island]")?.getAttribute("data-jota-load")).toBe("visible");
  });
});

describe("startIslands", () => {
  const html = (load: string) =>
    `<div data-jota-island="Counter" data-jota-load="${load}" data-jota-props='{"start":3}'><button>Count: 3</button></div>`;

  it("mounts an island that loads right away and makes it interactive", async () => {
    container.innerHTML = html("load");
    const found = startIslands({ "/src/islands/Counter.tsx": () => ({ default: Counter }) }, container);
    expect(found).toBe(1);
    await flush();
    const button = container.querySelector("button") as HTMLButtonElement;
    expect(button.textContent).toBe("Count: 3");
    button.click();
    expect(button.textContent).toBe("Count: 4");
    // The server HTML was replaced, not duplicated.
    expect(container.querySelectorAll("button")).toHaveLength(1);
  });

  it("accepts a named export and async loaders", async () => {
    container.innerHTML = html("load");
    startIslands({ "/src/islands/Counter.tsx": async () => ({ Counter }) }, container);
    await flush();
    expect(container.querySelector("button")?.textContent).toBe("Count: 3");
  });

  it("mounts an island only once", async () => {
    container.innerHTML = html("load");
    const loader = vi.fn(() => ({ default: Counter }));
    startIslands({ "/src/islands/Counter.tsx": loader }, container);
    startIslands({ "/src/islands/Counter.tsx": loader }, container);
    await flush();
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("waits for idle and for visibility", async () => {
    container.innerHTML = html("visible");
    // Without IntersectionObserver the island falls back to loading right away.
    vi.stubGlobal("IntersectionObserver", undefined);
    startIslands({ "/src/islands/Counter.tsx": () => ({ default: Counter }) }, container);
    await flush();
    expect(container.querySelector("[data-jota-mounted]")).not.toBeNull();
    vi.unstubAllGlobals();

    container.innerHTML = html("idle");
    startIslands({ "/src/islands/Counter.tsx": () => ({ default: Counter }) }, container);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(container.querySelector("[data-jota-mounted]")).not.toBeNull();
  });

  it("mounts when the observer reports the island is visible", async () => {
    const callbacks: Array<(entries: Array<{ isIntersecting: boolean }>) => void> = [];
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
          callbacks.push(callback);
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    container.innerHTML = html("visible");
    startIslands({ "/src/islands/Counter.tsx": () => ({ default: Counter }) }, container);
    await flush();
    expect(container.querySelector("[data-jota-mounted]")).toBeNull(); // not visible yet

    callbacks[0]?.([{ isIntersecting: false }]);
    await flush();
    expect(container.querySelector("[data-jota-mounted]")).toBeNull();

    callbacks[0]?.([{ isIntersecting: true }]);
    await flush();
    expect(container.querySelector("[data-jota-mounted]")).not.toBeNull();
    expect(disconnect).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("warns about unknown islands and returns the number found", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    container.innerHTML = html("load");
    expect(startIslands({}, container)).toBe(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no island named "Counter"'));
    container.innerHTML = "<p>no islands</p>";
    expect(startIslands({}, container)).toBe(0);
  });
});

describe("startIslands keeps what the user already did", () => {
  function Search(): Node {
    const [query, setQuery] = signal("");
    const wrapper = document.createElement("div");
    const input = document.createElement("input");
    input.addEventListener("input", () => setQuery(input.value));
    const out = document.createElement("p");
    render(() => () => `You typed: ${query()}`, out);
    const box = document.createElement("input");
    box.type = "checkbox";
    wrapper.append(input, box, out);
    return wrapper;
  }

  const serverHtml =
    '<div data-jota-island="Search" data-jota-load="load" data-jota-props="{}"><div><input><input type="checkbox"><p>You typed: </p></div></div>';

  it("carries typed text, checked boxes and focus into the mounted island", async () => {
    container.innerHTML = serverHtml;
    const [oldText, oldBox] = [...container.querySelectorAll("input")] as [HTMLInputElement, HTMLInputElement];
    oldText.value = "hello";
    oldBox.checked = true;
    oldText.focus();
    oldText.setSelectionRange(2, 4);

    startIslands({ "/src/islands/Search.tsx": () => ({ default: Search }) }, container);
    await flush();

    const [text, box] = [...container.querySelectorAll("input")] as [HTMLInputElement, HTMLInputElement];
    expect(text).not.toBe(oldText);
    expect(text.value).toBe("hello");
    expect(box.checked).toBe(true);
    expect(document.activeElement).toBe(text);
    expect([text.selectionStart, text.selectionEnd]).toEqual([2, 4]);
    // The component heard about the text, so its own state matches the screen.
    expect(container.querySelector("p")?.textContent).toBe("You typed: hello");
  });

  it("does not touch controls the user did not change", async () => {
    container.innerHTML = serverHtml;
    startIslands({ "/src/islands/Search.tsx": () => ({ default: Search }) }, container);
    await flush();
    const [text, box] = [...container.querySelectorAll("input")] as [HTMLInputElement, HTMLInputElement];
    expect(text.value).toBe("");
    expect(box.checked).toBe(false);
    expect(container.querySelector("p")?.textContent).toBe("You typed: ");
    expect(document.activeElement).not.toBe(text);
  });
});

