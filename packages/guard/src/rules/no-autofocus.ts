import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import { findAttribute, isDomTag, tagName, type JSXOpeningElementNode } from "../jsx.js";

export default createRule({
  id: "no-autofocus",
  level: "warn",
  description: "Disallow autoFocus on DOM elements.",
  messages: {
    autoFocus:
      "autoFocus moves focus without the user asking, which disorients screen reader and keyboard users. Remove it.",
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        if (!isDomTag(tagName(element))) return;
        const attr = findAttribute(element, "autoFocus") ?? findAttribute(element, "autofocus");
        if (!attr) return;
        const value = attr.value;
        const isFalse =
          value?.type === "JSXExpressionContainer" &&
          value.expression?.type === "Literal" &&
          value.expression.value === false;
        if (isFalse) return;
        context.report({ node: attr as unknown as Rule.Node, messageId: "autoFocus" });
      },
    };
  },
});
