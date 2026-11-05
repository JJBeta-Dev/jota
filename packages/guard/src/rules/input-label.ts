import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import {
  findAttribute,
  hasAttribute,
  hasSpread,
  staticString,
  tagName,
  type AncestorNode,
  type JSXElementNode,
} from "../jsx.js";

const CONTROLS = new Set(["input", "select", "textarea"]);
const EXEMPT_INPUT_TYPES = new Set(["hidden", "submit", "button", "reset", "image"]);

function isInsideLabel(node: AncestorNode): boolean {
  for (let current = node.parent; current; current = current.parent) {
    if (current.type === "JSXElement" && current.openingElement) {
      if (tagName(current.openingElement) === "label") return true;
    }
  }
  return false;
}

export default createRule({
  id: "input-label",
  level: "error",
  description: "Require a label on form controls.",
  messages: {
    missingLabel:
      "<{{tag}}> has no label. Connect a <label htmlFor>, wrap it in <label>, or add aria-label.",
  },
  create(context) {
    const labelledIds = new Set<string>();
    let hasDynamicLabelFor = false;
    const pending: Array<{ node: Rule.Node; tag: string; id: string }> = [];

    return {
      JSXElement(node: Rule.Node) {
        const element = node as unknown as JSXElementNode;
        const opening = element.openingElement;
        const tag = tagName(opening);
        if (tag === null) return;

        if (tag === "label") {
          const htmlFor = findAttribute(opening, "htmlFor");
          if (htmlFor) {
            const value = staticString(htmlFor);
            if (value === undefined) hasDynamicLabelFor = true;
            else labelledIds.add(value);
          }
          return;
        }

        if (!CONTROLS.has(tag)) return;
        if (hasSpread(opening)) return;
        if (tag === "input") {
          const type = staticString(findAttribute(opening, "type"));
          if (type !== undefined && EXEMPT_INPUT_TYPES.has(type)) return;
        }
        if (hasAttribute(opening, "aria-label") || hasAttribute(opening, "aria-labelledby")) {
          return;
        }
        if (isInsideLabel(element as unknown as AncestorNode)) return;

        const idAttr = findAttribute(opening, "id");
        if (idAttr) {
          const id = staticString(idAttr);
          if (id === undefined) return; // dynamic id: cannot judge
          pending.push({ node, tag, id });
          return;
        }
        context.report({ node, messageId: "missingLabel", data: { tag } });
      },
      "Program:exit"() {
        if (hasDynamicLabelFor) return;
        for (const item of pending) {
          if (!labelledIds.has(item.id)) {
            context.report({ node: item.node, messageId: "missingLabel", data: { tag: item.tag } });
          }
        }
      },
    };
  },
});
