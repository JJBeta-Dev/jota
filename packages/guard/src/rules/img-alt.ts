import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import { hasAttribute, hasSpread, tagName, type JSXOpeningElementNode } from "../jsx.js";

export default createRule({
  id: "img-alt",
  level: "error",
  description: "Require an alt attribute on <img>.",
  messages: {
    missingAlt:
      '<img> needs an `alt` attribute. Describe the image, or use alt="" if it is purely decorative.',
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        if (tagName(element) !== "img") return;
        /** Spread props may carry `alt`; stay silent instead of guessing. */
        if (hasSpread(element)) return;
        if (hasAttribute(element, "alt")) return;
        context.report({ node, messageId: "missingAlt" });
      },
    };
  },
});
