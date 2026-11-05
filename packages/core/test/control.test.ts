import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { signal } from "../src/reactive.js";
import { Show } from "../src/control.js";
import { render } from "../src/web.js";

let container: HTMLElement;
let unmount: () => void;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  unmount?.();
  container.remove();
});

describe("Show", () => {
  it("shows children while the value is truthy and the fallback otherwise", () => {
    const [value, setValue] = signal<string | null>("a");
    let built = 0;
    const props = {
      get when() {
        return value();
      },
      fallback: "none",
      get children() {
        built++;
        return "shown";
      },
    };
    unmount = render(() => Show(props), container);
    expect(container.textContent).toBe("shown");
    setValue("b"); // still truthy: children are not rebuilt
    expect(built).toBe(1);
    expect(container.textContent).toBe("shown");
    setValue(null);
    expect(container.textContent).toBe("none");
    setValue("c");
    expect(container.textContent).toBe("shown");
    expect(built).toBe(2);
  });

  it("keyed callback children re-run when the value changes, not only when truthiness does", () => {
    const [user, setUser] = signal<{ name: string } | null>({ name: "Ada" });
    const props = {
      get when() {
        return user();
      },
      fallback: "signed out",
      children: (item: { name: string }) => `Hello ${item.name}`,
    };
    unmount = render(() => Show(props), container);
    expect(container.textContent).toBe("Hello Ada");
    setUser({ name: "Grace" });
    expect(container.textContent).toBe("Hello Grace");
    setUser(null);
    expect(container.textContent).toBe("signed out");
  });
});
