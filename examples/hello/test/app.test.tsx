import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render } from "jota-js";
import { App } from "../src/App.js";

let container: HTMLElement;
let unmount: () => void;

const type = (value: string) => {
  const input = container.querySelector("#new-todo") as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
};
const submit = () => {
  (container.querySelector("form") as HTMLFormElement).dispatchEvent(
    new Event("submit", { bubbles: true, cancelable: true }),
  );
};

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  unmount = render(() => <App />, container);
});

afterEach(() => {
  unmount();
  container.remove();
});

describe("hello-jota todo app", () => {
  it("starts empty", () => {
    expect(container.querySelector("#empty")).not.toBeNull();
    expect(container.querySelector("#remaining")?.textContent).toBe("0 left");
  });

  it("adds tasks, clears the input and updates the counter", () => {
    type("Write docs");
    submit();
    type("Ship Guard");
    submit();

    expect([...container.querySelectorAll("li")].map((li) => li.textContent)).toEqual(["Write docs", "Ship Guard"]);
    expect(container.querySelector("#empty")).toBeNull();
    expect((container.querySelector("#new-todo") as HTMLInputElement).value).toBe("");
    expect(container.querySelector("#remaining")?.textContent).toBe("2 left");
  });

  it("ignores blank tasks", () => {
    type("   ");
    submit();
    expect(container.querySelectorAll("li")).toHaveLength(0);
  });

  it("toggles tasks and reuses the other items", () => {
    type("One");
    submit();
    type("Two");
    submit();
    const [first, second] = [...container.querySelectorAll("li")];

    const checkbox = first?.querySelector("input") as HTMLInputElement;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));

    expect(container.querySelector("#remaining")?.textContent).toBe("1 left");
    const after = [...container.querySelectorAll("li")];
    expect(after[0]?.className).toBe("done");
    expect(after[1]).toBe(second);
  });
});
