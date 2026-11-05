import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import {
  findAttribute,
  hasAttribute,
  hasSpread,
  staticString,
  tagName,
  type JSXOpeningElementNode,
} from "../jsx.js";

function declaresAspectRatio(element: JSXOpeningElementNode): boolean {
  const style = findAttribute(element, "style");
  if (!style?.value) return false;
  const text = staticString(style);
  if (text !== undefined) return /aspect-ratio/i.test(text);
  const properties = style.value.expression?.properties ?? [];
  return properties.some((prop) => {
    const key = prop.key;
    return (
      key?.name === "aspectRatio" ||
      key?.value === "aspect-ratio" ||
      key?.value === "aspectRatio"
    );
  });
}

export default createRule({
  id: "img-size",
  level: "warn",
  description: "Require width and height on <img> to avoid layout shift.",
  messages: {
    missingSize:
      "<img> has no width/height. Add both so the browser can reserve space (prevents layout shift).",
  },
  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const element = node as unknown as JSXOpeningElementNode;
        if (tagName(element) !== "img") return;
        if (hasSpread(element)) return;
        if (hasAttribute(element, "width") && hasAttribute(element, "height")) return;
        if (declaresAspectRatio(element)) return;
        context.report({ node, messageId: "missingSize" });
      },
    };
  },
});
