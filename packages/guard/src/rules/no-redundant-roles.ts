import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import { findAttribute, removeAttribute, hasAttribute, isDomTag, staticString, tagName, type JSXOpeningElementNode } from "../jsx.js";

const IMPLICIT: Record<string, string> = {
  button: "button",
  nav: "navigation",
  ul: "list",
  ol: "list",
  li: "listitem",
  table: "table",
  main: "main",
  form: "form",
  article: "article",
  aside: "complementary",
  h1: "heading",
  h2: "heading",
  h3: "heading",
  h4: "heading",
  h5: "heading",
  h6: "heading",
  hr: "separator",
  textarea: "textbox",
  dialog: "dialog",
  progress: "progressbar",
  meter: "meter",
};

export default createRule({
  id: "no-redundant-roles",
  level: "warn",
  description: "Disallow a role that the element already has.",
  fixable: true,
  messages: {
    redundantRole: '<{{tag}}> already has the role "{{role}}". Remove the role attribute.',
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        const name = tagName(element);
        if (!isDomTag(name)) return;
        const attr = findAttribute(element, "role");
        const role = staticString(attr)?.trim();
        if (role === undefined) return;
        const implicit = name === "a" ? (hasAttribute(element, "href") ? "link" : undefined) : IMPLICIT[name];
        if (implicit !== undefined && implicit === role) {
          context.report({ node: attr as unknown as Rule.Node, messageId: "redundantRole", fix: removeAttribute(context, attr as NonNullable<typeof attr>), data: { tag: name, role } });
        }
      },
    };
  },
});
