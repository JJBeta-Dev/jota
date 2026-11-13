import { describe, expect, it } from "vitest";
import { compileMarkdown, jotaMarkdown, parseFrontmatter } from "../src/markdown.js";

describe("parseFrontmatter", () => {
  it("reads strings, numbers, booleans and lists", () => {
    const { data, body } = parseFrontmatter(
      ['---', 'title: "Hello: world"', "order: 3", "draft: false", "tags: [a, b]", "authors:", "  - Ana", "  - Luis", "---", "# Body"].join("\n"),
    );
    expect(data).toEqual({ title: "Hello: world", order: 3, draft: false, tags: ["a", "b"], authors: ["Ana", "Luis"] });
    expect(body).toBe("# Body");
  });

  it("returns the source untouched when there is no front matter", () => {
    expect(parseFrontmatter("# Only body")).toEqual({ data: {}, body: "# Only body" });
  });

  it("explains a line it cannot read", () => {
    expect(() => parseFrontmatter("---\nnot a pair\n---\n")).toThrow(/cannot read the line "not a pair"/);
  });
});

describe("compileMarkdown", () => {
  it("renders HTML with heading ids and collects the headings", () => {
    const result = compileMarkdown("# Título único\n\n## Part\n\n## Part\n\nSome *text*.");
    expect(result.html).toContain('<h1 id="titulo-unico">Título único</h1>');
    expect(result.html).toContain('<h2 id="part-1">Part</h2>');
    expect(result.html).toContain("<em>text</em>");
    expect(result.headings).toEqual([
      { depth: 1, text: "Título único", id: "titulo-unico" },
      { depth: 2, text: "Part", id: "part" },
      { depth: 2, text: "Part", id: "part-1" },
    ]);
    expect(result.problems).toEqual([]);
  });

  it("escapes code blocks and accepts a highlighter", () => {
    expect(compileMarkdown("```html\n<b>&</b>\n```").html).toContain(
      '<pre><code class="language-html">&lt;b&gt;&amp;&lt;/b&gt;</code></pre>',
    );
    const custom = compileMarkdown("```js\nlet a\n```", { highlight: (code, language) => `<pre data-l="${language}">${code}</pre>` });
    expect(custom.html).toContain('<pre data-l="js">let a</pre>');
  });

  it("reports an image without alt text as an error", () => {
    const result = compileMarkdown("![](cat.png)\n\n![A cat](cat.png)");
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0]?.level).toBe("error");
    expect(result.problems[0]?.message).toContain("cat.png");
  });

  it("reports raw HTML images without alt", () => {
    expect(compileMarkdown('<img src="a.png">').problems[0]?.level).toBe("error");
    expect(compileMarkdown('<img src="a.png" alt="">').problems).toEqual([]);
  });

  it("warns about a skipped heading level", () => {
    const result = compileMarkdown("# One\n\n### Three");
    expect(result.problems).toEqual([
      { level: "warn", message: 'Heading "Three" jumps from level 1 to level 3. Do not skip levels.' },
    ]);
  });

  it("stays silent with guard: false", () => {
    expect(compileMarkdown("![](cat.png)\n\n# One\n\n### Three", { guard: false }).problems).toEqual([]);
  });
});

describe("jotaMarkdown", () => {
  type Transform = (this: unknown, code: string, id: string) => { code: string } | null;
  const transform = jotaMarkdown().transform as unknown as Transform;

  function context() {
    const warnings: string[] = [];
    return {
      warnings,
      warn: (message: string) => warnings.push(message),
      error: (message: string) => {
        throw new Error(message);
      },
    };
  }

  it("ignores other files", () => {
    expect(transform.call(context(), "x", "/a/b.tsx")).toBeNull();
  });

  it("turns a document into a module with a component", async () => {
    const out = transform.call(context(), "---\ntitle: Hi\n---\n# Hi\n", "/a/post.md");
    const url = "data:text/javascript;base64," + Buffer.from(out?.code ?? "").toString("base64");
    const module = (await import(url)) as { html: string; frontmatter: { title: string }; headings: unknown[] };
    expect(module.frontmatter.title).toBe("Hi");
    expect(module.html).toContain('<h1 id="hi">Hi</h1>');
    expect(module.headings).toHaveLength(1);
  });

  it("fails the build on a missing alt and names the file", () => {
    expect(() => transform.call(context(), "![](a.png)", "/a/post.md")).toThrow(/post\.md: Image "a\.png" has no alt text/);
  });

  it("warns, without failing, on a skipped heading level", () => {
    const ctx = context();
    expect(transform.call(ctx, "# A\n\n### C", "/a/post.md")).not.toBeNull();
    expect(ctx.warnings[0]).toContain("jumps from level 1 to level 3");
  });
});
