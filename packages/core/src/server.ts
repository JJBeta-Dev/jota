/**
 * Render a component to an HTML string on a Node server, at request time.
 *
 * Jota builds real DOM nodes, so on the server it needs a DOM. By default `renderToString` uses a small
 * DOM that ships with Jota (`dom: "light"`), which needs no installation and is several times faster.
 * Components that use browser APIs the light DOM does not have can ask for `dom: "happy-dom"`, a full
 * DOM (optional dependency: `npm install happy-dom`). Either DOM is installed on `globalThis` only
 * while the component renders, and rendering is synchronous, so two requests never see each other's
 * DOM. Load the data first, then render:
 *
 * @example
 * const data = await loadPosts();
 * const html = await renderToString(() => Page({ data }));
 * response.end(shell.replace("<!--app-->", html));
 */
import { lightGlobals } from "./server-dom.js";
import { mount, setMarking } from "./web.js";
import type { JSXElement } from "./types.js";

export interface RenderToStringOptions {
  /**
   * What to mark for the browser so it can hydrate this HTML: "page" numbers the whole component
   * (hydrate it with `hydrate`), "islands" numbers only what is inside `<Island>`, false adds no
   * marks (plain HTML). Default: "page".
   */
  hydrate?: "page" | "islands" | false;
  /** Address the page is served from, for code that reads `location`. Default: http://localhost/ */
  url?: string;
  /** "light" (default): the small DOM that ships with Jota. "happy-dom": a full DOM, needs happy-dom. */
  dom?: "light" | "happy-dom";
}

const HAPPY_GLOBALS = [
  "window", "document", "Node", "DocumentFragment", "Element", "HTMLElement", "HTMLInputElement",
  "HTMLTextAreaElement", "HTMLSelectElement", "Text", "Comment", "Event", "MouseEvent", "navigator", "location",
  "history", "CustomEvent", "MutationObserver", "getComputedStyle", "requestAnimationFrame",
] as const;

type HappyWindow = Record<string, unknown> & { happyDOM: { setURL: (url: string) => void } };

/** One window serves every request: creating and closing one costs more than rendering a small page. */
let shared: HappyWindow | undefined;

async function happyGlobals(url: string): Promise<Record<string, unknown>> {
  let Window: new (settings: { url: string }) => HappyWindow;
  try {
    ({ Window } = (await import("happy-dom")) as unknown as { Window: typeof Window });
  } catch (error) {
    throw new Error('Jota: dom: "happy-dom" needs happy-dom. Install it with `npm install happy-dom`.', { cause: error });
  }
  const window = (shared ??= new Window({ url: "http://localhost/" }));
  window.happyDOM.setURL(url);
  const values: Record<string, unknown> = {};
  for (const name of HAPPY_GLOBALS) {
    const value = name === "window" ? window : window[name];
    if (value === undefined) continue;
    values[name] = typeof value === "function" && !/^[A-Z]/.test(name) ? (value as () => unknown).bind(window) : value;
  }
  return values;
}

function install(values: Record<string, unknown>): () => void {
  const target = globalThis as unknown as Record<string, unknown>;
  const previous = new Map<string, PropertyDescriptor | undefined>();
  for (const [name, value] of Object.entries(values)) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(target, name, { value, configurable: true, writable: true });
  }
  return () => {
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete target[name];
    }
  };
}

/** Render `code` (usually a page component call) to HTML. */
export async function renderToString(code: () => JSXElement, options: RenderToStringOptions = {}): Promise<string> {
  const url = options.url ?? "http://localhost/";
  const values = options.dom === "happy-dom" ? await happyGlobals(url) : lightGlobals(url);
  /** From here on everything is synchronous: nothing else can run while the global DOM is installed. */
  const restore = install(values);
  try {
    const mode = options.hydrate === undefined ? "page" : options.hydrate;
    setMarking(mode === false ? null : mode);
    const container = document.createElement("div");
    const dispose = mount(code, container);
    setMarking(null);
    const html = container.innerHTML;
    dispose();
    return html;
  } finally {
    setMarking(null);
    restore();
  }
}
