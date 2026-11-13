import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import { findAttribute, removeAttribute, isDomTag, tagName, type JSXOpeningElementNode } from "../jsx.js";

export default createRule({
  id: "no-access-key",
  level: "warn",
  description: "Disallow accessKey.",
  fixable: true,
  messages: {
    accessKey:
      "accessKey shortcuts clash with screen reader and browser shortcuts. Remove it and let users reach the control with Tab.",
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        if (!isDomTag(tagName(element))) return;
        const attr = findAttribute(element, "accessKey") ?? findAttribute(element, "accesskey");
        if (attr) context.report({ node: attr as unknown as Rule.Node, messageId: "accessKey", fix: removeAttribute(context, attr as NonNullable<typeof attr>) });
      },
    };
  },
});
