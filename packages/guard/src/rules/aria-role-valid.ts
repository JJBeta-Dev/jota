import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import { findAttribute, isDomTag, staticString, tagName, type JSXOpeningElementNode } from "../jsx.js";

const ROLES = new Set([
  "alert",
  "alertdialog",
  "application",
  "article",
  "banner",
  "blockquote",
  "button",
  "caption",
  "cell",
  "checkbox",
  "code",
  "columnheader",
  "combobox",
  "complementary",
  "contentinfo",
  "definition",
  "deletion",
  "dialog",
  "directory",
  "document",
  "emphasis",
  "feed",
  "figure",
  "form",
  "generic",
  "grid",
  "gridcell",
  "group",
  "heading",
  "img",
  "insertion",
  "link",
  "list",
  "listbox",
  "listitem",
  "log",
  "main",
  "marquee",
  "math",
  "menu",
  "menubar",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "meter",
  "navigation",
  "none",
  "note",
  "option",
  "paragraph",
  "presentation",
  "progressbar",
  "radio",
  "radiogroup",
  "region",
  "row",
  "rowgroup",
  "rowheader",
  "scrollbar",
  "search",
  "searchbox",
  "separator",
  "slider",
  "spinbutton",
  "status",
  "strong",
  "subscript",
  "superscript",
  "switch",
  "tab",
  "table",
  "tablist",
  "tabpanel",
  "term",
  "textbox",
  "time",
  "timer",
  "toolbar",
  "tooltip",
  "tree",
  "treegrid",
  "treeitem",
]);

function isValidRole(token: string): boolean {
  return ROLES.has(token) || token.startsWith("doc-") || token.startsWith("graphics-");
}

export default createRule({
  id: "aria-role-valid",
  level: "error",
  description: "Require role values to be real ARIA roles.",
  messages: {
    invalidRole:
      'role="{{value}}" is not a valid ARIA role. Check the spelling, or remove the role and use the native element.',
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        if (!isDomTag(tagName(element))) return;
        const attr = findAttribute(element, "role");
        const value = staticString(attr);
        if (value === undefined) return;
        const tokens = value.trim().split(/\s+/).filter(Boolean);
        if (tokens.some(isValidRole)) return;
        context.report({ node: attr as unknown as Rule.Node, messageId: "invalidRole", data: { value } });
      },
    };
  },
});
