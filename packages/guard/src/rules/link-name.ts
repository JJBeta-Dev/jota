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
  id: "link-name",
  level: "error",
  description: "Require an accessible name and a real href on links.",
  messages: {
    missingName: "<a> has no accessible name. Add visible text or an aria-label.",
    invalidHref:
      '<a href="{{href}}"> does not navigate anywhere. Use a real URL, or a <button type="button"> for actions.',
  },
  create(context) {
    return {
      JSXElement(node: Rule.Node) {
        const element = node as unknown as JSXElementNode;
        const opening = element.openingElement;
        if (tagName(opening) !== "a") return;

        const href = staticString(findAttribute(opening, "href"));
        if (href !== undefined) {
          const value = href.trim().toLowerCase();
          if (value === "" || value === "#" || value.startsWith("javascript:")) {
            context.report({ node, messageId: "invalidHref", data: { href } });
          }
        }
        if (!mayHaveAccessibleName(element)) {
          context.report({ node, messageId: "missingName" });
        }
      },
    };
  },
});
