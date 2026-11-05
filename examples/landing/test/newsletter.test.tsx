import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render } from "jota-js";
import Newsletter from "../src/islands/Newsletter";

let container: HTMLElement;
let unmount: () => void;

const type = (value: string) => {
  const input = container.querySelector("input") as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
};
const submit = () =>
  (container.querySelector("form") as HTMLFormElement).dispatchEvent(
    new Event("submit", { bubbles: true, cancelable: true }),
  );
const message = () => container.querySelector("[role=status]")?.textContent;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  unmount = render(() => <Newsletter />, container);
});

afterEach(() => {
  unmount();
  container.remove();
});

describe("Newsletter island", () => {
  it("starts without a message", () => {
    expect(message()).toBe("");
  });

  it("rejects an invalid address", () => {
    type("not-an-email");
    submit();
    expect(message()).toBe("Please enter a valid email address.");
    expect(container.querySelector("[role=status]")?.className).toBe("error");
  });

  it("confirms a valid address and clears an earlier error", () => {
    type("nope");
    submit();
    type("ada@example.com");
    submit();
    expect(message()).toBe("Thanks, you are on the list.");
    expect(container.querySelector("[role=status]")?.className).toBe("ok");
  });
});
