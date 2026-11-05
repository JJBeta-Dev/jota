/**
 * DOM runtime used by code that the Jota compiler produces from JSX.
 *
 * The compiler (babel-plugin-jsx-dom-expressions, MIT) turns JSX into calls to the functions
 * exported here. They are public only because compiled code imports them: application code should
 * use `jota-js` instead.
 */
import { computed, createRoot, effect, untrack, type Accessor } from "./reactive.js";
import { mergeProps } from "./props.js";
import type { JSXElement } from "./types.js";

export { effect, mergeProps };

type Props = Record<string, unknown>;

/** Create a function that clones a static piece of HTML on every call. */
export function template(html: string, isImportNode?: boolean, isSVG?: boolean): () => Node {
  let node: Node | undefined;
  const create = (): Node => {
    const holder = document.createElement("template");
    holder.innerHTML = isSVG ? `<svg>${html}</svg>` : html;
    const root = holder.content.firstChild as Node;
    return isSVG ? (root.firstChild as Node) : root;
  };
  const clone = isImportNode
    ? () => untrack(() => document.importNode((node ??= create()), true))
    : () => (node ??= create()).cloneNode(true);
  (clone as unknown as { cloneNode: () => Node }).cloneNode = clone;
  return clone;
}

/** Cached derived value used for conditional JSX expressions. */
export function memo<T>(fn: Accessor<T>, equals?: boolean): Accessor<T> {
  return computed(fn, equals === false ? false : undefined);
}

/** Call a component once, without tracking. Components never re-run. */
export function createComponent<P extends Props>(component: (props: P) => JSXElement, props: P): JSXElement {
  return untrack(() => component(props ?? ({} as P)));
}

export function use<T>(fn: (element: Element, argument: T) => void, element: Element, argument: T): void {
  untrack(() => fn(element, argument));
}

// --- insert -------------------------------------------------------------------------------

function normalize(value: unknown, out: Node[]): void {
  while (typeof value === "function") value = (value as () => unknown)();
  if (value === null || value === undefined || typeof value === "boolean") return;
  if (Array.isArray(value)) {
    for (const item of value) normalize(item, out);
    return;
  }
  if (value instanceof DocumentFragment) {
    out.push(...Array.from(value.childNodes));
    return;
  }
  if (value instanceof Node) {
    out.push(value);
    return;
  }
  out.push(document.createTextNode(String(value)));
}

function reconcile(parent: Node, current: Node[], next: Node[], marker: Node | null): Node[] {
  if (current.length === next.length && current.every((node, i) => node === next[i])) return current;

  const keep = new Set(next);
  for (const old of current) {
    if (!keep.has(old) && old.parentNode === parent) parent.removeChild(old);
  }
  let reference: Node | null = marker;
  for (let i = next.length - 1; i >= 0; i--) {
    const node = next[i] as Node;
    if (node.parentNode !== parent || node.nextSibling !== reference) parent.insertBefore(node, reference);
    reference = node;
  }
  return next;
}

function render(parent: Node, value: unknown, current: Node[], marker: Node | null): Node[] {
  // Fast path: update an existing single text node in place.
  if ((typeof value === "string" || typeof value === "number") && current.length === 1) {
    const node = current[0] as Node;
    if (node.nodeType === 3) {
      const text = String(value);
      if ((node as Text).data !== text) (node as Text).data = text;
      return current;
    }
  }
  const next: Node[] = [];
  normalize(value, next);
  return reconcile(parent, current, next, marker);
}

/**
 * Place a value (text, node, array, or a function returning one) inside `parent`, before `marker`.
 * Functions are tracked, so only this spot updates when their signals change.
 */
export function insert(parent: Node, accessor: unknown, marker?: Node | null, initial?: Node[]): Node[] | void {
  const reference = marker ?? null;
  if (typeof accessor !== "function") {
    return render(parent, accessor, initial ?? [], reference);
  }
  effect<Node[]>((current) => render(parent, (accessor as () => unknown)(), current ?? [], reference), initial ?? []);
}

/** Mount a component into an element. Returns a function that unmounts it. */
export function mount(code: () => JSXElement, element: Element): () => void {
  return createRoot((dispose) => {
    insert(element, code);
    return () => {
      dispose();
      element.textContent = "";
    };
  });
}
export { mount as render };

// --- attributes, classes, styles, events ---------------------------------------------------

export function setAttribute(node: Element, name: string, value: unknown): void {
  if (value === null || value === undefined || value === false) node.removeAttribute(name);
  else node.setAttribute(name, value === true ? "" : String(value));
}

export function setAttributeNS(node: Element, namespace: string, name: string, value: unknown): void {
  if (value === null || value === undefined || value === false) node.removeAttributeNS(namespace, name);
  else node.setAttributeNS(namespace, name, value === true ? "" : String(value));
}

export function className(node: Element, value: unknown): void {
  if (value === null || value === undefined || value === false) node.removeAttribute("class");
  else node.setAttribute("class", String(value));
}

export function classList(node: Element, value: Record<string, unknown> | null | undefined, previous: Record<string, unknown> = {}): Record<string, unknown> {
  const next = value ?? {};
  for (const key of Object.keys(previous)) {
    if (!(key in next)) toggleClasses(node, key, false);
  }
  for (const key of Object.keys(next)) {
    const on = Boolean(next[key]);
    if (on !== Boolean(previous[key])) toggleClasses(node, key, on);
  }
  return next;
}

function toggleClasses(node: Element, names: string, on: boolean): void {
  for (const name of names.split(/\s+/)) if (name) node.classList.toggle(name, on);
}

export function setStyleProperty(node: HTMLElement, name: string, value: unknown): void {
  if (value === null || value === undefined) node.style.removeProperty(name);
  else node.style.setProperty(name, String(value));
}

export function style(node: HTMLElement, value: unknown, previous?: unknown): unknown {
  if (typeof value === "string") {
    node.style.cssText = value;
    return value;
  }
  const next = (value ?? {}) as Record<string, unknown>;
  const prior = typeof previous === "string" || !previous ? {} : (previous as Record<string, unknown>);
  if (typeof previous === "string") node.style.cssText = "";
  for (const key of Object.keys(prior)) if (!(key in next)) setStyleProperty(node, key, null);
  for (const key of Object.keys(next)) if (next[key] !== prior[key]) setStyleProperty(node, key, next[key]);
  return next;
}

type Handler = EventListener | [(data: unknown, event: Event) => void, unknown];

function toListener(handler: Handler): EventListener {
  return Array.isArray(handler)
    ? (event) => handler[0](handler[1], event)
    : handler;
}

export function addEventListener(node: Element, name: string, handler: Handler, delegate?: boolean): void {
  if (delegate) {
    (node as unknown as Record<string, unknown>)[`$$${name}`] = handler;
    return;
  }
  node.addEventListener(name, toListener(handler));
}

const delegated = new Set<string>();

function delegatedHandler(event: Event): void {
  const key = `$$${event.type}`;
  let node = event.target as (Node & Record<string, unknown>) | null;
  while (node) {
    const handler = node[key] as Handler | undefined;
    if (handler && !(node as unknown as { disabled?: boolean }).disabled) {
      toListener(handler).call(node, event);
      if (event.cancelBubble) return;
    }
    node = (node.parentNode as (Node & Record<string, unknown>) | null) ?? null;
  }
}

/** Listen once on the document and route events to elements. Only used when delegation is on. */
export function delegateEvents(names: string[], doc: Document = document): void {
  for (const name of names) {
    if (delegated.has(name)) continue;
    delegated.add(name);
    doc.addEventListener(name, delegatedHandler);
  }
}

// --- spread --------------------------------------------------------------------------------

const PROPERTY_NAMES = new Set([
  "value", "checked", "selected", "disabled", "hidden", "readOnly", "multiple", "indeterminate", "innerHTML", "textContent",
]);

function assignProp(node: Element, key: string, value: unknown, previous: unknown): void {
  if (key === "style") {
    style(node as HTMLElement, value, previous);
  } else if (key === "class" || key === "className") {
    className(node, value);
  } else if (key === "classList") {
    classList(node, value as Record<string, unknown>, previous as Record<string, unknown>);
  } else if (/^on[A-Z]/.test(key)) {
    const name = key.slice(2).toLowerCase();
    if (previous) node.removeEventListener(name, toListener(previous as Handler));
    if (value) node.addEventListener(name, toListener(value as Handler));
  } else if (PROPERTY_NAMES.has(key)) {
    (node as unknown as Record<string, unknown>)[key] = value;
  } else {
    setAttribute(node, key === "htmlFor" ? "for" : key, value);
  }
}

/** Apply a props object to an element, updating only the props that changed. */
export function assign(node: Element, props: Props, previous: Props = {}): Props {
  for (const key of Object.keys(previous)) {
    if (!(key in props) && key !== "children" && key !== "ref") assignProp(node, key, null, previous[key]);
  }
  for (const key of Object.keys(props)) {
    if (key === "children" || key === "ref") continue;
    const value = props[key];
    if (value !== previous[key]) assignProp(node, key, value, previous[key]);
    previous[key] = value;
  }
  return previous;
}

export function spread(node: Element, props: Props = {}, _isSVG?: boolean, skipChildren?: boolean): void {
  let children: Node[] = [];
  if (!skipChildren) {
    effect(() => {
      children = render(node, props.children, children, null);
    });
  }
  effect(() => {
    if (typeof props.ref === "function") use(props.ref as (element: Element, argument: unknown) => void, node, undefined);
  });
  const previous: Props = {};
  effect(() => {
    assign(node, props, previous);
  });
}
