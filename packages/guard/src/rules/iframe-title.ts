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

export default createRule({
  id: "iframe-title",
  level: "error",
  description: "Require a title on <iframe>.",
  messages: {
    missingTitle: "<iframe> needs a `title` that says what it contains. Screen readers announce it.",
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        if (tagName(element) !== "iframe" || hasSpread(element)) return;
        if (hasAttribute(element, "aria-label") || hasAttribute(element, "aria-labelledby")) return;
        const title = findAttribute(element, "title");
        if (title && title.value !== null) {
          /** A dynamic title (title={name}) is accepted; only a missing or empty one is reported. */
          const text = staticString(title);
          if (text === undefined || text.trim() !== "") return;
        }
        context.report({ node, messageId: "missingTitle" });
      },
    };
  },
});
