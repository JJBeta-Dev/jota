import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import {
  hasSpread,
  mayHaveAccessibleName,
  tagName,
  type ChildNode,
  type JSXOpeningElementNode,
} from "../jsx.js";

const HEADINGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

export default createRule({
  id: "heading-has-content",
  level: "error",
  description: "Require headings to have content.",
  messages: {
    emptyHeading: "<{{tag}}> is empty. Screen reader users navigate by headings, so give it text.",
  },
  create(context) {
    return {
      JSXElement(node: Rule.Node) {
        const element = node as unknown as { openingElement: JSXOpeningElementNode; children: ChildNode[] };
        const name = tagName(element.openingElement);
        if (name === null || !HEADINGS.has(name) || hasSpread(element.openingElement)) return;
        if (!mayHaveAccessibleName(element)) {
          context.report({ node, messageId: "emptyHeading", data: { tag: name } });
        }
      },
    };
  },
});
