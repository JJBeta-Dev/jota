import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import { isDomTag, tagName, type JSXOpeningElementNode } from "../jsx.js";

const ARIA_ATTRIBUTES = new Set([
  "aria-activedescendant",
  "aria-atomic",
  "aria-autocomplete",
  "aria-braillelabel",
  "aria-brailleroledescription",
  "aria-busy",
  "aria-checked",
  "aria-colcount",
  "aria-colindex",
  "aria-colindextext",
  "aria-colspan",
  "aria-controls",
  "aria-current",
  "aria-describedby",
  "aria-description",
  "aria-details",
  "aria-disabled",
  "aria-dropeffect",
  "aria-errormessage",
  "aria-expanded",
  "aria-flowto",
  "aria-grabbed",
  "aria-haspopup",
  "aria-hidden",
  "aria-invalid",
  "aria-keyshortcuts",
  "aria-label",
  "aria-labelledby",
  "aria-level",
  "aria-live",
  "aria-modal",
  "aria-multiline",
  "aria-multiselectable",
  "aria-orientation",
  "aria-owns",
  "aria-placeholder",
  "aria-posinset",
  "aria-pressed",
  "aria-readonly",
  "aria-relevant",
  "aria-required",
  "aria-roledescription",
  "aria-rowcount",
  "aria-rowindex",
  "aria-rowindextext",
  "aria-rowspan",
  "aria-selected",
  "aria-setsize",
  "aria-sort",
  "aria-valuemax",
  "aria-valuemin",
  "aria-valuenow",
  "aria-valuetext",
]);

export default createRule({
  id: "aria-props",
  level: "error",
  description: "Require aria-* attributes to be real ARIA attributes.",
  messages: {
    invalidAria: "{{name}} is not a valid ARIA attribute. Check the spelling.",
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        if (!isDomTag(tagName(element))) return;
        for (const attr of element.attributes) {
          if (attr.type !== "JSXAttribute" || attr.name.type !== "JSXIdentifier") continue;
          const name = attr.name.name;
          if (name !== undefined && name.startsWith("aria-") && !ARIA_ATTRIBUTES.has(name)) {
            context.report({ node: attr as unknown as Rule.Node, messageId: "invalidAria", data: { name } });
          }
        }
      },
    };
  },
});
