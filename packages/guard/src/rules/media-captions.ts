import type { Rule } from "eslint";
import { createRule } from "../create-rule.js";
import {
  findAttribute,
  hasAttribute,
  hasSpread,
  staticString,
  tagName,
  type JSXElementNode,
} from "../jsx.js";

function hasCaptionsTrack(element: JSXElementNode): boolean {
  return element.children.some((child) => {
    if (child.type !== "JSXElement" || !child.openingElement) return false;
    if (tagName(child.openingElement) !== "track") return false;
    const kind = staticString(findAttribute(child.openingElement, "kind"));
    // A dynamic `kind` cannot be judged, so it counts as present.
    return kind === undefined || kind === "captions";
  });
}

export default createRule({
  id: "media-captions",
  level: "warn",
  description: "Require a captions track on <video>.",
  messages: {
    missingCaptions:
      '<video> has no captions track. Add <track kind="captions" src="…" srclang="en">.',
  },
  create(context) {
    return {
      JSXElement(node: Rule.Node) {
        const element = node as unknown as JSXElementNode;
        const opening = element.openingElement;
        if (tagName(opening) !== "video") return;
        if (hasSpread(opening)) return;
        if (hasAttribute(opening, "muted")) return;
        if (hasCaptionsTrack(element)) return;
        context.report({ node, messageId: "missingCaptions" });
      },
    };
  },
});
