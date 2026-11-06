import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import { tagName, type JSXOpeningElementNode } from "../jsx.js";

export default createRule({
  id: "no-distracting-elements",
  level: "error",
  description: "Disallow <marquee> and <blink>.",
  messages: {
    distracting:
      "<{{tag}}> moves or flashes and cannot be paused. Remove it and use CSS animation that respects prefers-reduced-motion.",
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const name = tagName(node as unknown as JSXOpeningElementNode);
        if (name === "marquee" || name === "blink") {
          context.report({ node, messageId: "distracting", data: { tag: name } });
        }
      },
    };
  },
});
