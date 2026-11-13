/**
 * A small DOM for rendering on the server. It implements what the Jota runtime and typical components
 * use (elements, text, comments, fragments, attributes, classes, styles, cloning, parsing the static
 * HTML of templates, serializing) and nothing else: no layout, events, selectors or scripting. It is
 * several times faster than a full DOM, and `renderToString` uses it by default. Code that needs more
 * can ask for `dom: "happy-dom"`.
 */

const ELEMENT = 1;
const TEXT = 3;
const COMMENT = 8;
const FRAGMENT = 11;

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const RAW_TEXT = new Set(["script", "style"]);
const ESCAPABLE_RAW = new Set(["textarea", "title"]);

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decode(text: string): string {
  if (!text.includes("&")) return text;
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body.startsWith("#x") || body.startsWith("#X")) return String.fromCodePoint(parseInt(body.slice(2), 16));
    if (body.startsWith("#")) return String.fromCodePoint(parseInt(body.slice(1), 10));
    return ENTITIES[body.toLowerCase()] ?? match;
  });
}

function escapeText(text: string): string {
  return text.replace(/[&<> ]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&nbsp;"));
}

function escapeAttribute(text: string): string {
  return text.replace(/[&" ]/g, (c) => (c === "&" ? "&amp;" : c === '"' ? "&quot;" : "&nbsp;"));
}

export class LightNode {
  nodeType = 0;
  parentNode: LightNode | null = null;
  firstChild: LightNode | null = null;
  lastChild: LightNode | null = null;
  nextSibling: LightNode | null = null;
  previousSibling: LightNode | null = null;
  isConnected = false;

  get childNodes(): LightNode[] {
    const result: LightNode[] = [];
    for (let child = this.firstChild; child; child = child.nextSibling) result.push(child);
    return result;
  }

  hasChildNodes(): boolean {
    return this.firstChild !== null;
  }

  contains(other: LightNode | null): boolean {
    for (let node = other; node; node = node.parentNode) if (node === this) return true;
    return false;
  }

  private detach(): void {
    const parent = this.parentNode;
    if (!parent) return;
    if (this.previousSibling) this.previousSibling.nextSibling = this.nextSibling;
    else parent.firstChild = this.nextSibling;
    if (this.nextSibling) this.nextSibling.previousSibling = this.previousSibling;
    else parent.lastChild = this.previousSibling;
    this.parentNode = null;
    this.previousSibling = null;
    this.nextSibling = null;
  }

  insertBefore<T extends LightNode>(node: T, reference: LightNode | null): T {
    if (node.nodeType === FRAGMENT) {
      for (let child = node.firstChild; child; child = node.firstChild) this.insertBefore(child, reference);
      return node;
    }
    if (node === reference) return node;
    node.detach();
    node.parentNode = this;
    if (reference === null) {
      node.previousSibling = this.lastChild;
      if (this.lastChild) this.lastChild.nextSibling = node;
      else this.firstChild = node;
      this.lastChild = node;
    } else {
      node.nextSibling = reference;
      node.previousSibling = reference.previousSibling;
      if (reference.previousSibling) reference.previousSibling.nextSibling = node;
      else this.firstChild = node;
      reference.previousSibling = node;
    }
    return node;
  }

  appendChild<T extends LightNode>(node: T): T {
    return this.insertBefore(node, null);
  }

  removeChild<T extends LightNode>(node: T): T {
    if (node.parentNode === this) node.detach();
    return node;
  }

  replaceChild<T extends LightNode>(next: LightNode, old: T): T {
    this.insertBefore(next, old);
    this.removeChild(old);
    return old;
  }

  replaceChildren(...nodes: LightNode[]): void {
    while (this.firstChild) this.removeChild(this.firstChild);
    for (const node of nodes) this.appendChild(node);
  }

  remove(): void {
    this.detach();
  }

  get textContent(): string {
    let out = "";
    for (let child = this.firstChild; child; child = child.nextSibling) {
      if (child.nodeType === TEXT) out += (child as LightText).data;
      else if (child.nodeType !== COMMENT) out += child.textContent;
    }
    return out;
  }

  set textContent(value: string) {
    this.replaceChildren();
    if (value !== "") this.appendChild(new LightText(value));
  }

  cloneNode(_deep?: boolean): LightNode {
    return this;
  }

  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean {
    return true;
  }
}

export class LightText extends LightNode {
  override nodeType = TEXT;
  data: string;
  constructor(data: string) {
    super();
    this.data = data;
  }
  get nodeValue(): string {
    return this.data;
  }
  override get textContent(): string {
    return this.data;
  }
  override set textContent(value: string) {
    this.data = value;
  }
  override cloneNode(): LightText {
    return new LightText(this.data);
  }
}

export class LightComment extends LightNode {
  override nodeType = COMMENT;
  data: string;
  constructor(data: string) {
    super();
    this.data = data;
  }
  override get textContent(): string {
    return this.data;
  }
  override set textContent(value: string) {
    this.data = value;
  }
  override cloneNode(): LightComment {
    return new LightComment(this.data);
  }
}

export class LightFragment extends LightNode {
  override nodeType = FRAGMENT;
  override cloneNode(deep?: boolean): LightFragment {
    const copy = new LightFragment();
    if (deep) for (let child = this.firstChild; child; child = child.nextSibling) copy.appendChild(child.cloneNode(true));
    return copy;
  }
}

class ClassList {
  constructor(private readonly element: LightElement) {}
  private names(): string[] {
    return (this.element.getAttribute("class") ?? "").split(/\s+/).filter(Boolean);
  }
  private write(names: string[]): void {
    if (names.length === 0) this.element.removeAttribute("class");
    else this.element.setAttribute("class", names.join(" "));
  }
  contains(name: string): boolean {
    return this.names().includes(name);
  }
  add(...names: string[]): void {
    const current = this.names();
    for (const name of names) if (!current.includes(name)) current.push(name);
    this.write(current);
  }
  remove(...names: string[]): void {
    this.write(this.names().filter((name) => !names.includes(name)));
  }
  toggle(name: string, force?: boolean): boolean {
    const has = this.contains(name);
    const on = force ?? !has;
    if (on && !has) this.add(name);
    else if (!on && has) this.remove(name);
    return on;
  }
}

class Style {
  private readonly values = new Map<string, string>();
  constructor(private readonly element: LightElement) {}
  private sync(): void {
    if (this.values.size === 0) this.element.removeAttribute("style");
    else this.element.setAttribute("style", this.cssText);
  }
  get cssText(): string {
    return [...this.values].map(([name, value]) => `${name}: ${value};`).join(" ");
  }
  set cssText(text: string) {
    this.load(text);
    this.sync();
  }
  setProperty(name: string, value: string): void {
    this.values.set(name, value);
    this.sync();
  }
  removeProperty(name: string): void {
    this.values.delete(name);
    this.sync();
  }
  load(text: string): void {
    this.values.clear();
    for (const part of text.split(";")) {
      const at = part.indexOf(":");
      if (at > 0) this.values.set(part.slice(0, at).trim(), part.slice(at + 1).trim());
    }
  }
}

export class LightElement extends LightNode {
  override nodeType = ELEMENT;
  readonly tagName: string;
  readonly localName: string;
  private attributes = new Map<string, string>();
  private classes?: ClassList;
  private styles?: Style;
  /** Set only on <template>: the fragment that `innerHTML` fills. */
  content?: LightFragment;

  constructor(name: string) {
    super();
    this.localName = name.toLowerCase();
    this.tagName = this.localName.toUpperCase();
    if (this.localName === "template") this.content = new LightFragment();
  }

  get nodeName(): string {
    return this.tagName;
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }
  setAttribute(name: string, value: string): void {
    this.attributes.set(name, String(value));
    if (name === "style" && this.styles) this.styles.load(String(value));
  }
  setAttributeNS(_namespace: string | null, name: string, value: string): void {
    this.setAttribute(name, value);
  }
  removeAttribute(name: string): void {
    this.attributes.delete(name);
    if (name === "style" && this.styles) this.styles.load("");
  }
  removeAttributeNS(_namespace: string | null, name: string): void {
    this.removeAttribute(name);
  }
  hasAttribute(name: string): boolean {
    return this.attributes.has(name);
  }

  get classList(): ClassList {
    return (this.classes ??= new ClassList(this));
  }
  get className(): string {
    return this.getAttribute("class") ?? "";
  }
  set className(value: string) {
    this.setAttribute("class", value);
  }
  get style(): Style {
    if (!this.styles) {
      this.styles = new Style(this);
      this.styles.load(this.getAttribute("style") ?? "");
    }
    return this.styles;
  }
  get id(): string {
    return this.getAttribute("id") ?? "";
  }

  override cloneNode(deep?: boolean): LightElement {
    const copy = new LightElement(this.localName);
    for (const [name, value] of this.attributes) copy.attributes.set(name, value);
    if (this.content) copy.content = this.content.cloneNode(deep);
    if (deep) for (let child = this.firstChild; child; child = child.nextSibling) copy.appendChild(child.cloneNode(true));
    return copy;
  }

  get innerHTML(): string {
    let out = "";
    for (let child = this.firstChild; child; child = child.nextSibling) out += serialize(child, RAW_TEXT.has(this.localName));
    return out;
  }
  set innerHTML(html: string) {
    const target = this.content ?? this;
    target.replaceChildren();
    parseInto(html, target);
  }
  get outerHTML(): string {
    return serialize(this, false);
  }
}

function serialize(node: LightNode, raw: boolean): string {
  if (node.nodeType === TEXT) {
    const data = (node as LightText).data;
    return raw ? data : escapeText(data);
  }
  if (node.nodeType === COMMENT) return `<!--${(node as LightComment).data}-->`;
  if (node.nodeType === FRAGMENT) {
    let out = "";
    for (let child = node.firstChild; child; child = child.nextSibling) out += serialize(child, false);
    return out;
  }
  const element = node as LightElement;
  let out = `<${element.localName}`;
  for (const [name, value] of (element as unknown as { attributes: Map<string, string> }).attributes) {
    out += ` ${name}="${escapeAttribute(value)}"`;
  }
  out += ">";
  if (VOID.has(element.localName)) return out;
  out += element.innerHTML;
  return `${out}</${element.localName}>`;
}

/** Parse the static HTML that the compiler puts in templates (and ordinary well-formed markup). */
function parseInto(html: string, root: LightNode): void {
  const stack: LightNode[] = [root];
  const top = (): LightNode => stack[stack.length - 1] as LightNode;
  let i = 0;
  while (i < html.length) {
    if (html.startsWith("<!--", i)) {
      const end = html.indexOf("-->", i + 4);
      const stop = end === -1 ? html.length : end;
      top().appendChild(new LightComment(html.slice(i + 4, stop)));
      i = end === -1 ? html.length : end + 3;
    } else if (html.startsWith("<!>", i)) {
      top().appendChild(new LightComment(""));
      i += 3;
    } else if (html.startsWith("</", i)) {
      const end = html.indexOf(">", i);
      const name = html.slice(i + 2, end === -1 ? html.length : end).trim().toLowerCase();
      for (let depth = stack.length - 1; depth > 0; depth--) {
        if ((stack[depth] as LightElement).localName === name) {
          stack.length = depth;
          break;
        }
      }
      i = end === -1 ? html.length : end + 1;
    } else if (html[i] === "<" && /[a-zA-Z]/.test(html[i + 1] ?? "")) {
      let j = i + 1;
      while (j < html.length && !/[\s/>]/.test(html[j] as string)) j++;
      const element = new LightElement(html.slice(i + 1, j));
      let selfClosing = false;
      for (;;) {
        while (j < html.length && /\s/.test(html[j] as string)) j++;
        if (j >= html.length) break;
        if (html[j] === ">") {
          j++;
          break;
        }
        if (html[j] === "/" && html[j + 1] === ">") {
          selfClosing = true;
          j += 2;
          break;
        }
        if (html[j] === "/") {
          j++;
          continue;
        }
        let k = j;
        while (k < html.length && !/[\s=/>]/.test(html[k] as string)) k++;
        const name = html.slice(j, k);
        j = k;
        while (j < html.length && /\s/.test(html[j] as string)) j++;
        let value = "";
        if (html[j] === "=") {
          j++;
          while (j < html.length && /\s/.test(html[j] as string)) j++;
          const quote = html[j];
          if (quote === '"' || quote === "'") {
            const close = html.indexOf(quote, j + 1);
            const stop = close === -1 ? html.length : close;
            value = html.slice(j + 1, stop);
            j = close === -1 ? html.length : close + 1;
          } else {
            let m = j;
            while (m < html.length && !/[\s>]/.test(html[m] as string)) m++;
            value = html.slice(j, m);
            j = m;
          }
        }
        element.setAttribute(name.toLowerCase(), decode(value));
      }
      top().appendChild(element);
      i = j;
      const name = element.localName;
      if (VOID.has(name) || selfClosing) continue;
      if (RAW_TEXT.has(name) || ESCAPABLE_RAW.has(name)) {
        const close = html.toLowerCase().indexOf(`</${name}`, i);
        const stop = close === -1 ? html.length : close;
        const text = html.slice(i, stop);
        if (text) element.appendChild(new LightText(RAW_TEXT.has(name) ? text : decode(text)));
        const end = close === -1 ? html.length : html.indexOf(">", close);
        i = end === -1 ? html.length : end + 1;
        continue;
      }
      stack.push(element);
    } else {
      let end = html.indexOf("<", i + 1);
      if (end === -1) end = html.length;
      top().appendChild(new LightText(decode(html.slice(i, end))));
      i = end;
    }
  }
}

export class LightDocument extends LightNode {
  override nodeType = 9;
  readonly body: LightElement;
  readonly documentElement: LightElement;
  activeElement: LightElement | null = null;

  constructor() {
    super();
    this.documentElement = new LightElement("html");
    this.body = new LightElement("body");
    this.documentElement.appendChild(this.body);
  }

  createElement(name: string): LightElement {
    return new LightElement(name);
  }
  createElementNS(_namespace: string | null, name: string): LightElement {
    return new LightElement(name);
  }
  createTextNode(data: string): LightText {
    return new LightText(String(data));
  }
  createComment(data: string): LightComment {
    return new LightComment(data);
  }
  createDocumentFragment(): LightFragment {
    return new LightFragment();
  }
  importNode(node: LightNode, deep?: boolean): LightNode {
    return node.cloneNode(deep);
  }
}

/** One document for every request: templates cache the nodes they parse, keyed by the document. */
const lightDocument = new LightDocument();

/** The globals that `renderToString` installs while it renders with this DOM. */
export function lightGlobals(url: string): Record<string, unknown> {
  const location = new URL(url);
  const window = { document: lightDocument, location, navigator: { userAgent: "jota-server" }, history: {} } as Record<string, unknown>;
  window.window = window;
  return {
    window,
    document: lightDocument,
    location,
    navigator: window.navigator,
    history: window.history,
    Node: LightNode,
    Element: LightElement,
    HTMLElement: LightElement,
    HTMLInputElement: class HTMLInputElement {},
    HTMLTextAreaElement: class HTMLTextAreaElement {},
    HTMLSelectElement: class HTMLSelectElement {},
    Text: LightText,
    Comment: LightComment,
    DocumentFragment: LightFragment,
  };
}
