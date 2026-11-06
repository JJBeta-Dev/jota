/**
 * Render a component to an HTML string on a Node server, at request time.
 *
 * Jota builds real DOM nodes, so on the server it needs a DOM. `renderToString` uses happy-dom (an
 * optional dependency of this package: `npm install happy-dom`). The DOM is installed on `globalThis`
 * only while the component renders, and rendering is synchronous, so two requests never see each
 * other's DOM. Load the data first, then render:
 *
 * @example
 * const data = await loadPosts();
 * const html = await renderToString(() => Page({ data }));
 * response.end(shell.replace("<!--app-->", html));
 */
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
}

const GLOBAL_NAMES = [
  "window", "document", "Node", "DocumentFragment", "Element", "HTMLElement", "HTMLInputElement",
  "HTMLTextAreaElement", "Text", "Comment", "Event", "MouseEvent", "navigator", "location", "history",
  "CustomEvent", "MutationObserver", "getComputedStyle", "requestAnimationFrame",
] as const;

type DomWindow = Record<string, unknown> & { happyDOM: { close: () => Promise<void> | void } };

function installDom(window: DomWindow): () => void {
  const target = globalThis as unknown as Record<string, unknown>;
  const previous = new Map<string, PropertyDescriptor | undefined>();
  for (const name of GLOBAL_NAMES) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    const value = name === "window" ? window : window[name];
    if (value === undefined) continue;
    Object.defineProperty(target, name, {
      value: typeof value === "function" && !/^[A-Z]/.test(name) ? (value as () => unknown).bind(window) : value,
      configurable: true,
      writable: true,
    });
  }
  return () => {
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete target[name];
    }
    void window.happyDOM.close();
  };
}

/** Render `code` (usually a page component call) to HTML. Throws a clear error if happy-dom is missing. */
export async function renderToString(code: () => JSXElement, options: RenderToStringOptions = {}): Promise<string> {
  let Window: new (settings: { url: string }) => DomWindow;
  try {
    ({ Window } = (await import("happy-dom")) as unknown as { Window: typeof Window });
  } catch (error) {
    throw new Error("Jota: renderToString needs a DOM on the server. Install it with `npm install happy-dom`.", { cause: error });
  }
  /* From here on everything is synchronous: nothing else can run while the global DOM is installed. */
  const restore = installDom(new Window({ url: options.url ?? "http://localhost/" }));
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
