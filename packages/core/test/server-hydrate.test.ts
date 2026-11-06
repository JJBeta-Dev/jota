import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { signal } from "../src/reactive.js";
import { renderToString } from "../src/server.js";
import { hydrate, insert, template } from "../src/web.js";

const cardTemplate = template("<article><h3>Counter</h3><button></button></article>");
function Card(props: { start: number }): Node {
  const [count, setCount] = signal(props.start);
  const article = cardTemplate() as HTMLElement;
  const button = article.querySelector("button") as HTMLButtonElement;
  button.addEventListener("click", () => setCount(count() + 1));
  insert(button, () => `Clicked ${count()}`);
  return article;
}

let container: HTMLElement;
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});
afterEach(() => container.remove());

describe("renderToString then hydrate", () => {
  it("the browser keeps the HTML the server rendered and makes it interactive", async () => {
    const html = await renderToString(() => Card({ start: 4 }));
    container.innerHTML = html;
    const article = container.querySelector("article");
    const button = container.querySelector("button") as HTMLButtonElement;
    expect(button.textContent).toBe("Clicked 4");

    const unmount = hydrate(() => Card({ start: 4 }), container);
    expect(unmount).not.toBeNull();
    expect(container.querySelector("article")).toBe(article);
    expect(container.querySelector("button")).toBe(button);
    button.click();
    expect(button.textContent).toBe("Clicked 5");
  });

  it("falls back when the browser renders different data than the server did", async () => {
    container.innerHTML = await renderToString(() => Card({ start: 4 }));
    const Other = template("<div>Not a card</div>");
    expect(hydrate(() => Other(), container)).toBeNull();
  });

  it("does not disturb the DOM of the environment it runs in", async () => {
    const before = document;
    await renderToString(() => Card({ start: 1 }));
    expect(document).toBe(before);
    expect(document.body.contains(container)).toBe(true);
  });
});
