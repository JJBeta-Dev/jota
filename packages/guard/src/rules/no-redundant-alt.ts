import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import { findAttribute, staticString, tagName, type JSXOpeningElementNode } from "../jsx.js";

const REDUNDANT = /\b(image|photo|picture|graphic|img|icon)\b/i;

export default createRule({
  id: "no-redundant-alt",
  level: "warn",
  description: 'Disallow words like "image" or "photo" in alt text.',
  messages: {
    redundantAlt:
      'Screen readers already say "image". Remove the word "{{word}}" from the alt text and describe what the image shows.',
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        if (tagName(element) !== "img") return;
        const alt = findAttribute(element, "alt");
        const text = staticString(alt);
        if (text === undefined) return;
        const match = REDUNDANT.exec(text);
        if (match) {
          context.report({
            node: alt as unknown as Rule.Node,
            messageId: "redundantAlt",
            data: { word: match[0].toLowerCase() },
          });
        }
      },
    };
  },
});
