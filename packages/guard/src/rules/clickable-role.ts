import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import {
  findAttribute,
  hasAttribute,
  hasSpread,
  staticString,
  tagName,
  type JSXOpeningElementNode,
} from "../jsx.js";

const NON_INTERACTIVE_TAGS = new Set([
  "div", "span", "p", "li", "ul", "ol", "section", "article", "header", "footer", "main",
  "nav", "aside", "td", "th", "tr", "table", "tbody", "thead", "img", "svg", "i", "b",
  "strong", "em", "small", "h1", "h2", "h3", "h4", "h5", "h6", "figure", "figcaption",
  "blockquote", "pre", "code",
]);

const INTERACTIVE_ROLES = new Set([
  "button", "link", "checkbox", "menuitem", "menuitemcheckbox", "menuitemradio", "option",
  "radio", "switch", "tab", "treeitem", "combobox", "slider", "spinbutton", "textbox", "gridcell",
]);

const KEY_HANDLERS = ["onKeyDown", "onKeyUp", "onKeyPress"];

export default createRule({
  id: "clickable-role",
  level: "error",
  description: "Require interactive elements instead of clickable non-interactive elements.",
  messages: {
    notKeyboardAccessible:
      '<{{tag}}> with onClick is not keyboard accessible. Use <button type="button"> (or <a href>) instead.',
    incompleteRole:
      '<{{tag}} role="{{role}}"> needs tabIndex={0} and a keyboard handler (onKeyDown) to work with the keyboard. Prefer <button type="button">.',
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        const tag = tagName(element);
        if (tag === null || !NON_INTERACTIVE_TAGS.has(tag)) return;
        if (hasSpread(element)) return;
        if (!hasAttribute(element, "onClick")) return;

        const roleAttr = findAttribute(element, "role");
        if (!roleAttr) {
          context.report({ node, messageId: "notKeyboardAccessible", data: { tag } });
          return;
        }
        const role = staticString(roleAttr);
        if (role === undefined) return; // dynamic role: cannot judge
        if (role === "presentation" || role === "none") return;
        if (!INTERACTIVE_ROLES.has(role)) {
          context.report({ node, messageId: "notKeyboardAccessible", data: { tag } });
          return;
        }
        const keyboardReady =
          hasAttribute(element, "tabIndex") && KEY_HANDLERS.some((h) => hasAttribute(element, h));
        if (!keyboardReady) {
          context.report({ node, messageId: "incompleteRole", data: { tag, role } });
        }
      },
    };
  },
});
