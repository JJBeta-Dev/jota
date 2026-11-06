import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import { hasAttribute, hasSpread, isDomTag, tagName, type JSXOpeningElementNode } from "../jsx.js";

const PAIRS: Array<[string, string]> = [
  ["onMouseOver", "onFocus"],
  ["onMouseOut", "onBlur"],
];

export default createRule({
  id: "mouse-events-have-key-events",
  level: "warn",
  description: "Require onFocus with onMouseOver and onBlur with onMouseOut.",
  messages: {
    missingKeyEvent:
      "{{mouse}} needs {{key}} too, so keyboard users get the same behaviour as mouse users.",
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        if (!isDomTag(tagName(element)) || hasSpread(element)) return;
        for (const [mouse, key] of PAIRS) {
          if (hasAttribute(element, mouse) && !hasAttribute(element, key)) {
            context.report({ node, messageId: "missingKeyEvent", data: { mouse, key } });
          }
        }
      },
    };
  },
});
