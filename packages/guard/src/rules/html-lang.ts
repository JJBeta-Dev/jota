import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import {
  findAttribute,
  hasSpread,
  staticString,
  tagName,
  type JSXOpeningElementNode,
} from "../jsx.js";

export default createRule({
  id: "html-lang",
  level: "error",
  description: "Require a lang attribute on <html>.",
  messages: {
    missingLang:
      '<html> needs a lang attribute (for example lang="en"). Screen readers use it to pick the voice.',
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        if (tagName(element) !== "html") return;
        if (hasSpread(element)) return;
        const lang = findAttribute(element, "lang");
        /** A dynamic value (lang={locale}) is accepted; only a missing or empty lang is reported. */
        if (lang && staticString(lang)?.trim() !== "") return;
        context.report({ node, messageId: "missingLang" });
      },
    };
  },
});
