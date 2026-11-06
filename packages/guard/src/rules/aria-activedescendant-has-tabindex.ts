import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import {
  findAttribute,
  hasAttribute,
  hasSpread,
  isDomTag,
  staticNumber,
  tagName,
  type JSXOpeningElementNode,
} from "../jsx.js";

const NATIVELY_FOCUSABLE = new Set(["input", "select", "textarea", "button", "summary"]);

export default createRule({
  id: "aria-activedescendant-has-tabindex",
  level: "error",
  description: "Require tabIndex on elements that use aria-activedescendant.",
  messages: {
    needsTabIndex:
      "<{{tag}}> uses aria-activedescendant but cannot take focus. Add tabIndex={0} (or tabIndex={-1} if focus is set by script).",
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        const name = tagName(element);
        if (!isDomTag(name) || hasSpread(element)) return;
        if (!hasAttribute(element, "aria-activedescendant")) return;
        if (NATIVELY_FOCUSABLE.has(name)) return;
        if (name === "a" && hasAttribute(element, "href")) return;
        const tabIndex = findAttribute(element, "tabIndex");
        if (tabIndex !== undefined && (staticNumber(tabIndex) !== undefined || tabIndex.value?.type === "JSXExpressionContainer")) return;
        context.report({ node, messageId: "needsTabIndex", data: { tag: name } });
      },
    };
  },
});
