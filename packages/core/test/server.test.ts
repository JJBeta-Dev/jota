/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { signal } from "../src/reactive.js";
import { renderToString } from "../src/server.js";
import { insert, template } from "../src/web.js";

const pageTemplate = template("<section><h2>Title</h2><p></p></section>");
function Page(props: { text: string }): Node {
  const section = pageTemplate() as HTMLElement;
  insert((section.firstChild as Node).nextSibling as HTMLElement, () => props.text);
  return section;
}

describe("renderToString", () => {
  it("renders a component to HTML without a DOM in the environment", async () => {
    expect(typeof document).toBe("undefined");
    const html = await renderToString(() => Page({ text: "Hello" }), { hydrate: false });
    expect(html).toBe("<section><h2>Title</h2><p>Hello</p></section>");
  });

  it("leaves no global DOM behind", async () => {
    await renderToString(() => Page({ text: "x" }));
    expect(typeof document).toBe("undefined");
    expect(typeof window).toBe("undefined");
  });

  it("marks the page for hydration by default and can leave marks out", async () => {
    const marked = await renderToString(() => Page({ text: "Hi" }));
    expect(marked).toMatch(/<section data-hk="0\.[a-z0-9]+">/);
    expect(marked).toContain("<!--[0-->");
    const plain = await renderToString(() => Page({ text: "Hi" }), { hydrate: false });
    expect(plain).not.toContain("data-hk");
    expect(plain).not.toContain("<!--");
  });

  it("numbers each render from zero, so every request gives the same marks", async () => {
    const first = await renderToString(() => Page({ text: "a" }));
    const second = await renderToString(() => Page({ text: "a" }));
    expect(second).toBe(first);
  });

  it("keeps simultaneous requests apart", async () => {
    const texts = Array.from({ length: 25 }, (_, i) => `text-${i}`);
    const results = await Promise.all(texts.map((text) => renderToString(() => Page({ text }), { hydrate: false })));
    results.forEach((html, i) => expect(html).toContain(`<p>text-${i}</p>`));
  });

  it("passes the request address to code that reads location", async () => {
    const tmpl = template("<span></span>");
    const html = await renderToString(
      () => {
        const span = tmpl() as HTMLElement;
        insert(span, () => window.location.pathname);
        return span;
      },
      { hydrate: false, url: "http://example.test/blog/first" },
    );
    expect(html).toBe("<span>/blog/first</span>");
  });

  it("restores the DOM even when the component throws", async () => {
    await expect(
      renderToString(() => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(typeof document).toBe("undefined");
    const [read] = signal(1);
    expect(read()).toBe(1);
  });
});
