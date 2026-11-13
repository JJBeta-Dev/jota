import { afterEach, describe, expect, it } from "vitest";
import { signal } from "../src/index.js";
import { checkAccessibility, cleanup, expectAccessible, render } from "../src/testing.js";

afterEach(cleanup);

describe("jota-js/testing", () => {
  it("renders into the document and unmounts", () => {
    const [count, setCount] = signal(1);
    const { container, unmount } = render(() => {
      const paragraph = document.createElement("p");
      paragraph.textContent = String(count());
      return paragraph;
    });
    expect(document.body.contains(container)).toBe(true);
    expect(container.innerHTML).toBe("<p>1</p>");
    setCount(2);
    unmount();
    expect(document.body.contains(container)).toBe(false);
  });

  it("cleanup removes everything that was rendered", () => {
    const first = render(() => document.createElement("p")).container;
    const second = render(() => document.createElement("p")).container;
    cleanup();
    expect(document.body.contains(first) || document.body.contains(second)).toBe(false);
  });

  it("reports an image without alt text, found in the rendered DOM", async () => {
    const { container } = render(() => {
      const image = document.createElement("img");
      image.setAttribute("src", "/cat.png");
      return image;
    });
    const violations = await checkAccessibility(container);
    expect(violations.map((violation) => violation.id)).toContain("image-alt");
    await expect(expectAccessible(container)).rejects.toThrow(/image-alt/);
  });

  it("passes accessible markup", async () => {
    const { container } = render(() => {
      const button = document.createElement("button");
      button.setAttribute("type", "button");
      button.textContent = "Save";
      return button;
    });
    await expect(expectAccessible(container)).resolves.toBeUndefined();
  });
});
