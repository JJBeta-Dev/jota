import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import { findAttribute, staticNumber, type JSXOpeningElementNode } from "../jsx.js";

export default createRule({
  id: "no-positive-tabindex",
  level: "warn",
  description: "Disallow tabIndex values greater than 0.",
  messages: {
    positiveTabIndex: "tabIndex of {{value}} changes the natural tab order. Use 0 or -1.",
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        const value = staticNumber(findAttribute(element, "tabIndex"));
        if (value !== undefined && value > 0) {
          context.report({ node, messageId: "positiveTabIndex", data: { value: String(value) } });
        }
      },
    };
  },
});
