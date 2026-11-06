import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import {
  findAttribute,
  hasAttribute,
  hasSpread,
  isDomTag,
  staticString,
  tagName,
  type JSXOpeningElementNode,
} from "../jsx.js";

const NON_INTERACTIVE_ROLES = new Set([
  "article", "banner", "complementary", "contentinfo", "definition", "directory", "document", "feed", "figure",
  "group", "heading", "img", "list", "listitem", "main", "math", "navigation", "none", "note", "presentation",
  "region", "row", "rowgroup", "separator", "status", "table", "term",
]);

function isInteractive(element: JSXOpeningElementNode, name: string): boolean {
  if (name === "button" || name === "select" || name === "textarea") return true;
  if (name === "a") return hasAttribute(element, "href");
  if (name === "input") return staticString(findAttribute(element, "type")) !== "hidden";
  return false;
}

export default createRule({
  id: "no-interactive-element-to-noninteractive-role",
  level: "error",
  description: "Disallow giving a non-interactive role to an interactive element.",
  messages: {
    wrongRole:
      '<{{tag}}> is interactive, but role="{{role}}" tells assistive technology it is not. Remove the role or use a different element.',
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        const name = tagName(element);
        if (!isDomTag(name) || hasSpread(element) || !isInteractive(element, name)) return;
        const attr = findAttribute(element, "role");
        const role = staticString(attr)?.trim().split(/\s+/)[0];
        if (role !== undefined && NON_INTERACTIVE_ROLES.has(role)) {
          context.report({ node: attr as unknown as Rule.Node, messageId: "wrongRole", data: { tag: name, role } });
        }
      },
    };
  },
});
