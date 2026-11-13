import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import {
  findAttribute,
  hasAttribute,
  hasSpread,
  isDomTag,
  staticString,
  tagName,
  type JSXOpeningElementNode,
} from "../jsx.js";

const REQUIRED: Record<string, string[]> = {
  checkbox: ["aria-checked"],
  radio: ["aria-checked"],
  switch: ["aria-checked"],
  menuitemcheckbox: ["aria-checked"],
  menuitemradio: ["aria-checked"],
  slider: ["aria-valuenow"],
  scrollbar: ["aria-valuenow"],
  heading: ["aria-level"],
};

const HEADINGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

export default createRule({
  id: "role-has-required-aria-props",
  level: "error",
  description: "Require the aria-* attributes that a role needs.",
  messages: {
    missingProps: 'role="{{role}}" needs {{props}}. Without it, screen readers cannot tell the state.',
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        const name = tagName(element);
        if (!isDomTag(name) || hasSpread(element)) return;
        const role = staticString(findAttribute(element, "role"))?.trim().split(/\s+/)[0];
        if (role === undefined) return;
        const required = REQUIRED[role];
        if (required === undefined) return;
        if (name === "input" || (role === "heading" && HEADINGS.has(name))) return;
        const missing = required.filter((prop) => !hasAttribute(element, prop));
        if (missing.length > 0) {
          context.report({ node, messageId: "missingProps", data: { role, props: missing.join(", ") } });
        }
      },
    };
  },
});
