import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import { findAttribute, isDomTag, staticString, tagName, type JSXOpeningElementNode } from "../jsx.js";

// Shape of a BCP 47 tag: "en", "es-CO", "zh-Hant-TW". It checks the form, not the language registry.
const LANG_TAG = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/;

export default createRule({
  id: "valid-lang",
  level: "error",
  description: "Require lang values to look like a language tag.",
  messages: {
    invalidLang: 'lang="{{value}}" is not a language tag. Use a code such as "en", "es" or "es-CO".',
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        if (!isDomTag(tagName(element))) return;
        const attr = findAttribute(element, "lang");
        const value = staticString(attr);
        // Dynamic values and the empty string ("language unknown") are not judged here.
        if (value === undefined || value === "" || LANG_TAG.test(value)) return;
        context.report({ node: attr as unknown as Rule.Node, messageId: "invalidLang", data: { value } });
      },
    };
  },
});
