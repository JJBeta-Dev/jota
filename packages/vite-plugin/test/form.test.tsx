import { afterEach, describe, expect, it } from "vitest";
import { render } from "jota-js";
import { Signup, saved } from "./fixtures/Signup.js";

let unmount: (() => void) | undefined;
afterEach(() => {
  unmount?.();
  document.body.replaceChildren();
});

describe("createForm in compiled JSX", () => {
  it("links the control to its error, focuses it on a failed submit, then submits", async () => {
    const container = document.body.appendChild(document.createElement("div"));
    unmount = render(() => <Signup />, container);
    const form = container.querySelector("form") as HTMLFormElement;
    const input = container.querySelector("input") as HTMLInputElement;
    const message = container.querySelector("p") as HTMLElement;

    expect(input.id).toBe("field-email");
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(message.getAttribute("role")).toBe("alert");

    form.dispatchEvent(new Event("submit", { cancelable: true }));
    await Promise.resolve();
    expect(message.textContent).toBe("Enter an email address.");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(message.id);
    expect(document.activeElement).toBe(input);
    expect(saved).toEqual([]);

    input.value = "ana@example.com";
    input.dispatchEvent(new Event("input"));
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(message.textContent).toBe("");

    form.dispatchEvent(new Event("submit", { cancelable: true }));
    await Promise.resolve();
    expect(saved).toEqual([{ email: "ana@example.com" }]);
  });
});
