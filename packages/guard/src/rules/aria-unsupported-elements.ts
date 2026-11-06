import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import { hasAttribute, isDomTag, tagName, type JSXOpeningElementNode } from "../jsx.js";

const UNSUPPORTED = new Set(["meta", "html", "script", "style", "head", "title", "base", "link", "noscript"]);

export default createRule({
  id: "aria-unsupported-elements",
  level: "error",
  description: "Disallow role and aria-* on elements that do not support them.",
  messages: {
    unsupported: "<{{tag}}> does not support role or aria-* attributes. Remove {{name}}.",
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        const name = tagName(element);
        if (!isDomTag(name) || !UNSUPPORTED.has(name)) return;
        for (const attr of element.attributes) {
          if (attr.type !== "JSXAttribute" || attr.name.type !== "JSXIdentifier") continue;
          const attrName = attr.name.name;
          if (attrName === "role" || (attrName !== undefined && attrName.startsWith("aria-"))) {
            context.report({
              node: attr as unknown as Rule.Node,
              messageId: "unsupported",
              data: { tag: name, name: attrName },
            });
          }
        }
        void hasAttribute;
      },
    };
  },
});
