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

/* --- hydration ---------------------------------------------------------------------------- */

/* Build time: while a static page is rendered, every template root gets `data-hk="<n>.<hash>"` and */
/* every dynamic spot is wrapped in `<!--[n-->` ... `<!--]n-->`, numbered in the order they are created. */
/* Browser: the same code runs again in the same order, so `hydrate` can hand the existing elements */
/* back to it instead of creating new ones. The hash of each template is checked, and anything that */
/* does not line up marks the hydration as failed, so the caller falls back to mounting from scratch. */

interface Marks {
  /** "page": number everything. "islands": number only what is inside an island. */
  mode: "page" | "islands";
  active: boolean;
  t: number;
  s: number;
}

interface Hydration {
  elements: Map<string, Element>;
  /** Server content of each dynamic spot, taken out of the DOM until its `insert` puts it back. */
  slots: Map<number, Node[]>;
  t: number;
  s: number;
  failed: boolean;
}

let marks: Marks | null = null;
let hydration: Hydration | null = null;

/** Build time only: start (or stop, with `null`) numbering templates and dynamic spots. */
export function setMarking(mode: "page" | "islands" | null): void {
  marks = mode === null ? null : { mode, active: mode === "page", t: 0, s: 0 };
}

/** Build time only: an island's content is numbered on its own, so each island can hydrate alone. */
export function markIsland<T>(code: () => T): T {
  const current = marks;
  if (current === null || current.mode !== "islands") return code();
  const saved = { active: current.active, t: current.t, s: current.s };
  current.active = true;
  current.t = 0;
  current.s = 0;
  try {
    return code();
  } finally {
    current.active = saved.active;
    current.t = saved.t;
    current.s = saved.s;
  }
}

/** Number a dynamic spot before its content is built; undefined when nothing is being numbered. */
function reserveSlot(): number | undefined {
  if (hydration !== null) return hydration.s++;
  if (marks !== null && marks.active) return marks.s++;
  return undefined;
}

function hashOf(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  return (hash >>> 0).toString(36);
}

/**
 * Register the marked elements under `parent` and take the content of every dynamic spot out of the
 * DOM. Compiled code finds static nodes with `firstChild` and `nextSibling`, so each element must
 * look like its template again: exactly the static markup, with nothing the server put in the spots.
 */
function strip(parent: Node, found: Hydration): void {
  let child = parent.firstChild;
  while (child) {
    const next: ChildNode | null = child.nextSibling;
    if (child.nodeType === 1) {
      const key = (child as Element).getAttribute("data-hk");
      if (key !== null) found.elements.set(key, child as Element);
      strip(child, found);
      child = next;
    } else if (child.nodeType === 8 && (child as Comment).data.startsWith("[")) {
      const id = Number((child as Comment).data.slice(1));
      const closing = `]${id}`;
      const holder = document.createDocumentFragment();
      let cursor = next;
      while (cursor && !(cursor.nodeType === 8 && (cursor as Comment).data === closing)) {
        const following: ChildNode | null = cursor.nextSibling;
        holder.appendChild(cursor);
        cursor = following;
      }
      if (!cursor) {
        found.failed = true;
        child = next;
        continue;
      }
      const after: ChildNode | null = cursor.nextSibling;
      parent.removeChild(cursor);
      parent.removeChild(child);
      /* Spots nested at the same level, and elements inside, are handled the same way. */
      strip(holder, found);
      found.slots.set(id, Array.from(holder.childNodes));
      child = after;
    } else {
      child = next;
    }
  }
}

/** True when `element` holds server HTML that was marked for hydration. */
export function isHydratable(element: Element): boolean {
  return element.querySelector("[data-hk]") !== null;
}

/**
 * Run `code` so that templates and dynamic spots claim the marked server nodes inside `root`.
 * Returns false when something did not line up (the caller must then mount from scratch).
 */
export function withHydration(root: Element, code: () => void): boolean {
  const found: Hydration = { elements: new Map(), slots: new Map(), t: 0, s: 0, failed: false };
  const active = document.activeElement;
  const input = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement ? active : null;
  const caret: [number | null, number | null] | null = input ? [input.selectionStart, input.selectionEnd] : null;
  strip(root, found);
  if (found.elements.size === 0 && found.slots.size === 0) return false;
  const saved = hydration;
  hydration = found;
  try {
    code();
  } finally {
    hydration = saved;
  }
  /* Putting nodes back moved them, which drops focus; give it back to the same element. */
  if (active instanceof HTMLElement && active.isConnected && document.activeElement !== active) {
    active.focus();
    if (input && caret && caret[0] !== null && caret[1] !== null) {
      try {
        input.setSelectionRange(caret[0], caret[1]);
      } catch {
        /* Some input types have no selection. */
      }
    }
  }
  /* Every marked element and every spot must have been claimed; a leftover is server HTML that the
     component did not build. */
  return !found.failed && found.elements.size === 0 && found.slots.size === 0;
}

/**
 * Make server-rendered HTML interactive without rebuilding it: the existing elements are kept (so
 * focus, scroll position and typed text survive) and only listeners and effects are attached.
 * Returns an unmount function, or null when the HTML did not match what the component builds, in
 * which case nothing was kept and the caller should use `mount`.
 */
export function hydrate(code: () => JSXElement, element: Element): (() => void) | null {
  let ok = false;
  const dispose = createRoot((dispose) => {
    /* The root spot is numbered before the component runs, exactly as `mount` does at build time. */
    ok = withHydration(element, () => {
      const id = reserveSlot();
      insert(element, untrack(code), null, undefined, id);
    });
    return dispose;
  });
  if (!ok) {
    dispose();
    return null;
  }
  return () => {
    dispose();
    element.textContent = "";
  };
}

/** Create a function that clones a static piece of HTML on every call. */
export function template(html: string, isImportNode?: boolean, isSVG?: boolean): () => Node {
  let node: Node | undefined;
  let hash: string | undefined;
  const create = (): Node => {
    const holder = document.createElement("template");
    /* For SVG the compiler already wraps the markup in <svg>...</svg>; the node we want is inside it. */
    holder.innerHTML = html;
    const root = holder.content.firstChild as Node;
    return isSVG ? (root.firstChild as Node) : root;
  };
  const fresh = isImportNode
    ? () => untrack(() => document.importNode((node ??= create()), true))
    : () => (node ??= create()).cloneNode(true);
  const clone = (): Node => {
    const h = hydration;
    if (h !== null) {
      const key = `${h.t++}.${(hash ??= hashOf(html))}`;
      const existing = h.elements.get(key);
      if (existing !== undefined) {
        h.elements.delete(key);
        existing.removeAttribute("data-hk");
        return existing;
      }
      h.failed = true;
      return fresh();
    }
    const created = fresh();
    const m = marks;
    if (m !== null && m.active && created.nodeType === 1) {
      (created as Element).setAttribute("data-hk", `${m.t++}.${(hash ??= hashOf(html))}`);
    }
    return created;
  };
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

/* --- insert ------------------------------------------------------------------------------- */

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

/**
 * Indexes (into `values`) of one longest strictly increasing subsequence. Nodes in this subsequence
 * are already in the right relative order, so only the others have to move: swapping two rows of a
 * long list moves two nodes instead of all of them.
 */
function longestIncreasingSubsequence(values: number[]): number[] {
  const previous = new Array<number>(values.length);
  const tails: number[] = []; /* tails[k] = index of the smallest tail of an increasing run of length k + 1 */
  for (let i = 0; i < values.length; i++) {
    const value = values[i] as number;
    let low = 0;
    let high = tails.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      if ((values[tails[middle] as number] as number) < value) low = middle + 1;
      else high = middle;
    }
    previous[i] = low > 0 ? (tails[low - 1] as number) : -1;
    tails[low] = i;
  }
  const result: number[] = [];
  for (let i = tails.length > 0 ? (tails[tails.length - 1] as number) : -1; i >= 0; i = previous[i] as number) {
    result.push(i);
  }
  return result.reverse();
}

function reconcile(parent: Node, current: Node[], next: Node[], marker: Node | null): Node[] {
  if (current.length === next.length && current.every((node, i) => node === next[i])) return current;

  /* First render of this spot: insert everything in one go. */
  if (current.length === 0) {
    if (next.length === 0) return next;
    const fragment = document.createDocumentFragment();
    for (const node of next) fragment.appendChild(node);
    parent.insertBefore(fragment, marker);
    return next;
  }

  const keep = new Set(next);
  for (const old of current) {
    if (!keep.has(old) && old.parentNode === parent) parent.removeChild(old);
  }

  /* Nodes that were already here keep their place if they are part of a longest increasing run of */
  /* old positions; every other node is inserted before its successor. */
  const oldPosition = new Map<Node, number>();
  current.forEach((node, index) => oldPosition.set(node, index));
  const positions: number[] = [];
  const nextIndexOf: number[] = [];
  next.forEach((node, index) => {
    const old = oldPosition.get(node);
    if (old !== undefined && node.parentNode === parent) {
      positions.push(old);
      nextIndexOf.push(index);
    }
  });
  const stable = new Set(longestIncreasingSubsequence(positions).map((position) => nextIndexOf[position] as number));

  let reference: Node | null = marker;
  for (let i = next.length - 1; i >= 0; i--) {
    const node = next[i] as Node;
    if (!stable.has(i)) parent.insertBefore(node, reference);
    reference = node;
  }
  return next;
}

function render(parent: Node, value: unknown, current: Node[], marker: Node | null): Node[] {
  /* Fast path: update an existing single text node in place. */
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
export function insert(parent: Node, accessor: unknown, marker?: Node | null, initial?: Node[], reserved?: number): Node[] | void {
  let reference = marker ?? null;
  let start: Node[] | undefined = initial;

  const h = hydration;
  const m = marks;
  if (h !== null) {
    /* Put back what the server rendered for this spot, in its place among the static nodes. The render
       below keeps the nodes that were claimed and replaces the rest (for example text). */
    const id = reserved ?? h.s++;
    const existing = h.slots.get(id);
    if (existing) {
      h.slots.delete(id);
      for (const node of existing) parent.insertBefore(node, reference);
      start = existing;
    } else {
      h.failed = true;
    }
  } else if (m !== null && m.active) {
    const id = reserved ?? m.s++;
    const begin = document.createComment(`[${id}`);
    const end = document.createComment(`]${id}`);
    parent.insertBefore(begin, reference);
    parent.insertBefore(end, reference);
    reference = end;
  }

  const spot = reference;
  if (typeof accessor !== "function") {
    return render(parent, accessor, start ?? [], spot);
  }
  effect<Node[]>((current) => render(parent, (accessor as () => unknown)(), current ?? [], spot), start ?? []);
}

/** Mount a component into an element. Returns a function that unmounts it. */
export function mount(code: () => JSXElement, element: Element): () => void {
  return createRoot((dispose) => {
    /* Build the root once, without tracking: only the value it returns (a node or an accessor) is */
    /* inserted reactively. Calling `code` inside the insert effect would rebuild the whole root */
    /* every time something it returns changes. */
    /* The root spot is numbered before the root is built (hydration depends on that order). */
    const id = reserveSlot();
    insert(element, untrack(code), null, undefined, id);
    return () => {
      dispose();
      element.textContent = "";
    };
  });
}
export { mount as render };

/* --- attributes, classes, styles, events --------------------------------------------------- */

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

/* --- spread -------------------------------------------------------------------------------- */

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
