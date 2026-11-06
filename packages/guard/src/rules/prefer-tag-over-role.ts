import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import { findAttribute, hasSpread, staticString, tagName, type JSXOpeningElementNode } from "../jsx.js";

const TAGS: Record<string, string> = {
  button: "<button>",
  link: "<a href>",
  heading: "<h1> to <h6>",
  list: "<ul> or <ol>",
  listitem: "<li>",
  navigation: "<nav>",
  main: "<main>",
  banner: "<header>",
  contentinfo: "<footer>",
  complementary: "<aside>",
  article: "<article>",
  form: "<form>",
  checkbox: '<input type="checkbox">',
  textbox: "<input> or <textarea>",
};

export default createRule({
  id: "prefer-tag-over-role",
  level: "warn",
  description: "Prefer the native element over a div or span with a role.",
  messages: {
    preferTag:
      '<{{tag}} role="{{role}}"> can be {{native}}. The native element brings keyboard support and semantics for free.',
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        const name = tagName(element);
        if ((name !== "div" && name !== "span") || hasSpread(element)) return;
        const attr = findAttribute(element, "role");
        const role = staticString(attr)?.trim();
        const native = role === undefined ? undefined : TAGS[role];
        if (role !== undefined && native !== undefined) {
          context.report({ node: attr as unknown as Rule.Node, messageId: "preferTag", data: { tag: name, role, native } });
        }
      },
    };
  },
});
