import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import {
  findAttribute,
  mayHaveAccessibleName,
  staticString,
  tagName,
  type JSXElementNode,
} from "../jsx.js";

export default createRule({
  id: "button-name",
  level: "error",
  description: "Require an accessible name on buttons.",
  messages: {
    missingName: "<button> has no accessible name. Add visible text or an aria-label.",
  },
  create(context) {
    return {
      JSXElement(node: Rule.Node) {
        const element = node as unknown as JSXElementNode;
        const opening = element.openingElement;
        const isButton = tagName(opening) === "button";
        const isRoleButton = staticString(findAttribute(opening, "role")) === "button";
        if (!isButton && !isRoleButton) return;
        if (mayHaveAccessibleName(element)) return;
        context.report({ node, messageId: "missingName" });
      },
    };
  },
});
