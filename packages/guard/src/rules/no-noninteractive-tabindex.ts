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

const INTERACTIVE = new Set([
  "a", "button", "input", "select", "textarea", "summary", "details", "audio", "video", "iframe", "embed", "object",
]);
// A focusable <div> that reacts to events is clickable-role's job; this rule is for plain content.
const HANDLERS = ["onClick", "onKeyDown", "onKeyUp", "onKeyPress", "onMouseDown", "onPointerDown"];

export default createRule({
  id: "no-noninteractive-tabindex",
  level: "warn",
  description: "Disallow tabIndex={0} on elements that are not interactive.",
  messages: {
    nonInteractive:
      "<{{tag}}> is not interactive, so tabIndex={{value}} puts a stop in the tab order that does nothing. Remove it, or give the element a role and a handler.",
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        const name = tagName(element);
        if (!isDomTag(name) || INTERACTIVE.has(name) || hasSpread(element)) return;
        const value = staticNumber(findAttribute(element, "tabIndex"));
        if (value === undefined || value < 0) return;
        if (hasAttribute(element, "role") || hasAttribute(element, "contentEditable")) return;
        if (HANDLERS.some((handler) => hasAttribute(element, handler))) return;
        context.report({ node, messageId: "nonInteractive", data: { tag: name, value: `{${value}}` } });
      },
    };
  },
});
