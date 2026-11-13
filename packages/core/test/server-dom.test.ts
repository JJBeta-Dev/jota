/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { renderToString } from "../src/server.js";
import { classList, className, insert, setAttribute, style, template } from "../src/web.js";

type Case = [name: string, component: () => Node];

const cases: Case[] = [
  [
    "attributes, entities, boolean attributes and void elements",
    () => {
      const make = template('<div class="a  b" data-x=\'1\' title="Fish &amp; &quot;chips&quot;" hidden>Hi &amp; bye &lt;tag&gt;<br><img src=x alt=""><input disabled value=3></div>');
      return make();
    },
  ],
  [
    "comments and the <!> marker",
    () => {
      const make = template("<p>one<!>two<!-- note --></p>");
      return make();
    },
  ],
  [
    "dynamic text with characters that need escaping",
    () => {
      const make = template("<p></p>");
      const p = make();
      insert(p, () => 'a < b && c > "d"   end');
      return p;
    },
  ],
  [
    "numbers, null, booleans and arrays",
    () => {
      const make = template("<ul></ul>");
      const ul = make();
      insert(ul, () => [1, null, false, "two", [3, ["four"]]]);
      return ul;
    },
  ],
  [
    "nested templates",
    () => {
      const outer = template("<section><h2>Title</h2><div></div></section>");
      const item = template("<span class=item></span>");
      const section = outer();
      const holder = (section.firstChild as Node).nextSibling as Node;
      insert(holder, () => ["x", "y"].map((label) => {
        const span = item();
        insert(span, () => label);
        return span;
      }));
      return section;
    },
  ],
  [
    "attributes set at run time",
    () => {
      const make = template("<a>link</a>");
      const a = make() as Element;
      setAttribute(a, "href", "/path?x=1&y=2");
      setAttribute(a, "aria-current", true);
      setAttribute(a, "data-gone", null);
      setAttribute(a, "title", 'say "hi"');
      return a;
    },
  ],
  [
    "className and classList",
    () => {
      const make = template("<div></div>");
      const div = make() as HTMLElement;
      className(div, "one two");
      classList(div, { two: false, three: true, four: true });
      return div;
    },
  ],
  [
    "inline styles",
    () => {
      const make = template("<div></div>");
      const div = make() as HTMLElement;
      style(div, { color: "red", "margin-top": "4px" });
      style(div, { color: "blue" }, { color: "red", "margin-top": "4px" });
      return div;
    },
  ],
  [
    "svg",
    () => {
      const make = template('<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M0 0h10v10z"></path></svg>', true, true);
      return make();
    },
  ],
  [
    "style and script content stay unescaped",
    () => {
      const make = template("<div><style>a > b { color: red }</style><script>if (a < b && c) {}</script></div>");
      return make();
    },
  ],
];

describe("light DOM gives the same HTML as a full DOM", () => {
  for (const [name, component] of cases) {
    it(name, async () => {
      const light = await renderToString(component, { hydrate: false, dom: "light" });
      const full = await renderToString(component, { hydrate: false, dom: "happy-dom" });
      expect(light).toBe(full);
    });

    it(`${name} (with hydration marks)`, async () => {
      const light = await renderToString(component, { hydrate: "page", dom: "light" });
      const full = await renderToString(component, { hydrate: "page", dom: "happy-dom" });
      expect(light).toBe(full);
    });
  }

  it("really produces the expected markup (the comparison is not vacuous)", async () => {
    const [, component] = cases[0] as Case;
    const light = await renderToString(component, { hydrate: false, dom: "light" });
    expect(light).toContain('title="Fish &amp; &quot;chips&quot;"');
    expect(light).toContain("Hi &amp; bye &lt;tag&gt;");
    expect(light).toContain("<br>");
    expect(light).toContain('<input disabled="" value="3">');
    expect(light).not.toContain("</br>");
  });

  it("keeps working when both DOMs are used one after the other", async () => {
    const make = template("<b>x</b>");
    for (let i = 0; i < 3; i++) {
      expect(await renderToString(() => make(), { hydrate: false, dom: "light" })).toBe("<b>x</b>");
      expect(await renderToString(() => make(), { hydrate: false, dom: "happy-dom" })).toBe("<b>x</b>");
    }
  });

  it("is the default and needs no extra package", async () => {
    const make = template("<i>ok</i>");
    expect(await renderToString(() => make(), { hydrate: false })).toBe("<i>ok</i>");
  });
});
