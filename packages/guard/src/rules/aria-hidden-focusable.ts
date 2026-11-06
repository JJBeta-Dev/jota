import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import {
  findAttribute,
  hasAttribute,
  hasSpread,
  isDomTag,
  isTrueAttribute,
  staticNumber,
  staticString,
  tagName,
  type JSXOpeningElementNode,
} from "../jsx.js";

const NATIVELY_FOCUSABLE = new Set(["button", "select", "textarea", "summary"]);

function isFocusable(element: JSXOpeningElementNode, name: string): boolean {
  const tabIndex = staticNumber(findAttribute(element, "tabIndex"));
  if (tabIndex !== undefined) return tabIndex >= 0;
  if (NATIVELY_FOCUSABLE.has(name)) return true;
  if (name === "a") return hasAttribute(element, "href");
  if (name === "input") return staticString(findAttribute(element, "type")) !== "hidden";
  return false;
}

export default createRule({
  id: "aria-hidden-focusable",
  level: "error",
  description: 'Disallow aria-hidden="true" on elements that can receive focus.',
  messages: {
    hiddenFocusable:
      "<{{tag}}> is hidden from screen readers (aria-hidden) but a keyboard user can still focus it. Remove aria-hidden or add tabIndex={-1}.",
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        const name = tagName(element);
        if (!isDomTag(name) || hasSpread(element)) return;
        if (!isTrueAttribute(findAttribute(element, "aria-hidden"))) return;
        if (isFocusable(element, name)) {
          context.report({ node, messageId: "hiddenFocusable", data: { tag: name } });
        }
      },
    };
  },
});
