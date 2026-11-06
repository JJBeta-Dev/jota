import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import { hasSpread, tagName, type ChildNode, type JSXOpeningElementNode } from "../jsx.js";

const AMBIGUOUS = new Set(["click here", "here", "read more", "more", "learn more", "link", "this", "this link"]);

export default createRule({
  id: "anchor-ambiguous-text",
  level: "warn",
  description: 'Disallow link text like "click here" or "read more".',
  messages: {
    ambiguous:
      'The link text "{{text}}" means nothing out of context (screen readers list links on their own). Say where the link goes.',
  },
  create(context) {
    return {
      JSXElement(node: Rule.Node) {
        const element = node as unknown as { openingElement: JSXOpeningElementNode; children: ChildNode[] };
        if (tagName(element.openingElement) !== "a" || hasSpread(element.openingElement)) return;
        // Only plain text is judged: any expression or element inside makes the text unknowable.
        if (element.children.length === 0 || element.children.some((child) => child.type !== "JSXText")) return;
        const text = element.children
          .map((child) => child.value ?? "")
          .join("")
          .replace(/\s+/g, " ")
          .trim();
        const normalized = text.toLowerCase().replace(/[.!:>»→…]+$/u, "").trim();
        if (AMBIGUOUS.has(normalized)) {
          context.report({ node, messageId: "ambiguous", data: { text } });
        }
      },
    };
  },
});
