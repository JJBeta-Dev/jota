import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import { findAttribute, hasSpread, isDomTag, tagName, type JSXOpeningElementNode } from "../jsx.js";

export default createRule({
  id: "scope-valid",
  level: "error",
  description: "Allow the scope attribute only on <th>.",
  messages: {
    invalidScope: "The scope attribute only works on <th>, not on <{{tag}}>. Move it to the header cell.",
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        const name = tagName(element);
        if (!isDomTag(name) || name === "th" || hasSpread(element)) return;
        const attr = findAttribute(element, "scope");
        if (attr) {
          context.report({ node: attr as unknown as Rule.Node, messageId: "invalidScope", data: { tag: name } });
        }
      },
    };
  },
});
