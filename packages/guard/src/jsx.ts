
export interface ValueNode {
  type: string;
  value?: unknown;
  expression?: {
    type: string;
    value?: unknown;
    expressions?: unknown[];
    operator?: string;
    argument?: { type: string; value?: unknown };
    quasis?: Array<{ value: { cooked?: string | null } }>;
    properties?: Array<{
      type: string;
      key?: { type: string; name?: string; value?: unknown };
    }>;
  };
}

export interface JSXAttributeNode {
  type: "JSXAttribute";
  name: { type: string; name?: string };
  value: ValueNode | null;
}

export interface JSXSpreadAttributeNode {
  type: "JSXSpreadAttribute";
}

export type AttributeNode = JSXAttributeNode | JSXSpreadAttributeNode;

export interface JSXOpeningElementNode {
  type: "JSXOpeningElement";
  name: { type: string; name?: string };
  attributes: AttributeNode[];
}

export interface ChildNode {
  type: string;
  value?: string;
  expression?: { type: string };
  openingElement?: JSXOpeningElementNode;
  children?: ChildNode[];
}

export interface JSXElementNode {
  type: "JSXElement";
  openingElement: JSXOpeningElementNode;
  children: ChildNode[];
  parent?: AncestorNode;
}

export interface AncestorNode {
  type: string;
  parent?: AncestorNode;
  openingElement?: JSXOpeningElementNode;
}

/** Tag name of a plain JSX identifier (`div`, `Button`), or null for member/namespaced names. */
export function tagName(opening: JSXOpeningElementNode): string | null {
  return opening.name.type === "JSXIdentifier" && opening.name.name !== undefined
    ? opening.name.name
    : null;
}

/** True for lowercase tags that are plain DOM elements (components start with an uppercase letter). */
export function isDomTag(name: string | null): name is string {
  return name !== null && /^[a-z]/.test(name);
}

export function hasSpread(opening: JSXOpeningElementNode): boolean {
  return opening.attributes.some((attr) => attr.type === "JSXSpreadAttribute");
}

export function findAttribute(
  opening: JSXOpeningElementNode,
  name: string,
): JSXAttributeNode | undefined {
  for (const attr of opening.attributes) {
    if (
      attr.type === "JSXAttribute" &&
      attr.name.type === "JSXIdentifier" &&
      attr.name.name === name
    ) {
      return attr;
    }
  }
  return undefined;
}

export function hasAttribute(opening: JSXOpeningElementNode, name: string): boolean {
  return findAttribute(opening, name) !== undefined;
}

/** Static string value of an attribute (a="x", a={"x"}, a={`x`}), otherwise undefined. */
export function staticString(attr: JSXAttributeNode | undefined): string | undefined {
  const value = attr?.value;
  if (!value) return undefined;
  if (value.type === "Literal") {
    return typeof value.value === "string" ? value.value : undefined;
  }
  if (value.type === "JSXExpressionContainer" && value.expression) {
    const expr = value.expression;
    if (expr.type === "Literal" && typeof expr.value === "string") return expr.value;
    if (expr.type === "TemplateLiteral" && expr.expressions?.length === 0) {
      return expr.quasis?.[0]?.value.cooked ?? undefined;
    }
  }
  return undefined;
}

/** Static numeric value of an attribute (a={1} or a="1"), otherwise undefined. */
export function staticNumber(attr: JSXAttributeNode | undefined): number | undefined {
  const value = attr?.value;
  if (!value) return undefined;
  let raw: unknown;
  if (value.type === "Literal") {
    raw = value.value;
  } else if (value.type === "JSXExpressionContainer" && value.expression) {
    const expr = value.expression;
    if (expr.type === "Literal") {
      raw = expr.value;
    } else if (
      expr.type === "UnaryExpression" &&
      expr.operator === "-" &&
      expr.argument?.type === "Literal" &&
      typeof expr.argument.value === "number"
    ) {
      raw = -expr.argument.value;
    }
  }
  if (typeof raw === "number") return raw;
  if (typeof raw === "string" && raw.trim() !== "" && !Number.isNaN(Number(raw))) {
    return Number(raw);
  }
  return undefined;
}

/** True for a bare attribute (`aria-hidden`), ="true" or ={true}. */
export function isTrueAttribute(attr: JSXAttributeNode | undefined): boolean {
  if (!attr) return false;
  if (attr.value === null) return true;
  if (staticString(attr) === "true") return true;
  const value = attr.value;
  return (
    value.type === "JSXExpressionContainer" &&
    value.expression?.type === "Literal" &&
    value.expression.value === true
  );
}

/**
 * Can this element have an accessible name? Returns true when a name exists OR when we cannot
 * tell (components, expressions, spread props). Returns false only when it is definitely empty.
 */
export function mayHaveAccessibleName(element: {
  openingElement: JSXOpeningElementNode;
  children?: ChildNode[];
}): boolean {
  const opening = element.openingElement;
  if (hasSpread(opening)) return true;

  const label = findAttribute(opening, "aria-label");
  if (label) {
    const text = staticString(label);
    if (text === undefined || text.trim() !== "") return true;
  }
  if (hasAttribute(opening, "aria-labelledby")) return true;
  const title = findAttribute(opening, "title");
  if (title) {
    const text = staticString(title);
    if (text === undefined || text.trim() !== "") return true;
  }

  return childrenMayHaveName(element.children ?? []);
}

function childrenMayHaveName(children: ChildNode[]): boolean {
  for (const child of children) {
    if (child.type === "JSXText") {
      if ((child.value ?? "").trim() !== "") return true;
    } else if (child.type === "JSXExpressionContainer") {
      if (child.expression && child.expression.type !== "JSXEmptyExpression") return true;
    } else if (child.type === "JSXFragment") {
      if (childrenMayHaveName(child.children ?? [])) return true;
    } else if (child.type === "JSXElement" && child.openingElement) {
      const opening = child.openingElement;
      const name = tagName(opening);
      if (!isDomTag(name)) return true;
      if (isTrueAttribute(findAttribute(opening, "aria-hidden"))) continue;
      if (name === "img") {
        const alt = findAttribute(opening, "alt");
        if (alt) {
          const text = staticString(alt);
          if (text === undefined || text.trim() !== "") return true;
        }
        continue;
      }
      if (mayHaveAccessibleName({ openingElement: opening, children: child.children ?? [] })) {
        return true;
      }
    }
  }
  return false;
}
