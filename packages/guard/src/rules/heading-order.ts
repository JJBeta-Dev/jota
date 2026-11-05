import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import { tagName, type JSXOpeningElementNode } from "../jsx.js";

export default createRule({
  id: "heading-order",
  level: "warn",
  description: "Do not skip heading levels and use a single h1.",
  messages: {
    skippedLevel:
      "Heading jumps from <h{{from}}> to <h{{to}}>. Use <h{{next}}>, and style it with CSS if you need a smaller look.",
    multipleH1: "Only one <h1> per page. Use <h2> or lower for this heading.",
  },
  create(context) {
    const headings: Array<{ node: Rule.Node; level: number }> = [];

    return {
      JSXOpeningElement(node: Rule.Node) {
        const name = tagName(node as unknown as JSXOpeningElementNode);
        if (name === null || !/^h[1-6]$/.test(name)) return;
        headings.push({ node, level: Number(name.slice(1)) });
      },
      "Program:exit"() {
        let seenH1 = false;
        headings.forEach((heading, index) => {
          if (heading.level === 1) {
            if (seenH1) context.report({ node: heading.node, messageId: "multipleH1" });
            seenH1 = true;
          }
          const previous = headings[index - 1];
          if (previous && heading.level > previous.level + 1) {
            context.report({
              node: heading.node,
              messageId: "skippedLevel",
              data: {
                from: String(previous.level),
                to: String(heading.level),
                next: String(previous.level + 1),
              },
            });
          }
        });
      },
    };
  },
});
