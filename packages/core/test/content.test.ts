import { describe, expect, it } from "vitest";
import { defineCollection } from "../src/content.js";

const file = (frontmatter: Record<string, unknown>) => ({ html: "<p>x</p>", frontmatter, headings: [] });

describe("defineCollection", () => {
  it("returns typed entries sorted by slug", () => {
    const posts = defineCollection(
      { "./posts/b-second.md": file({ title: "B", order: 2, tags: ["x"] }), "./posts/a-first.md": file({ title: "A", order: 1, draft: true }) },
      { title: "string", order: "number", draft: "boolean?", tags: "string[]?" },
    );
    expect(posts.map((post) => post.slug)).toEqual(["a-first", "b-second"]);
    const title: string = posts[0]?.data.title ?? "";
    expect(title).toBe("A");
    expect(posts[0]?.data.draft).toBe(true);
    expect(posts[1]?.data.draft).toBeUndefined();
    expect(posts[1]?.data.tags).toEqual(["x"]);
    expect(posts[0]?.html).toBe("<p>x</p>");
  });

  it("names the file and the field when one is missing", () => {
    expect(() => defineCollection({ "./posts/a.md": file({}) }, { title: "string" })).toThrow('./posts/a.md: front matter needs "title" (string).');
  });

  it("names the file and the field when the type is wrong", () => {
    expect(() => defineCollection({ "./posts/a.md": file({ title: 3 }) }, { title: "string" })).toThrow('./posts/a.md: "title" must be string, got 3.');
    expect(() => defineCollection({ "./posts/a.md": file({ tags: "x" }) }, { tags: "string[]" })).toThrow(/"tags" must be string\[\]/);
  });
});
