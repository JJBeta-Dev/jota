/**
 * Islands: interactive components inside otherwise static pages.
 *
 * `<Island>` renders a component into HTML at build time, wrapped in an element that records which
 * component it is and its props. In the browser, `startIslands` finds those wrappers and mounts the
 * component again (it replaces the server HTML, it does not hydrate), when the island loads, the
 * browser is idle, or the island scrolls into view. Pages without islands keep shipping no JavaScript.
 */
import { createComponent, insert, mount } from "./web.js";
import type { JSXElement } from "./types.js";

export type IslandLoad = "load" | "idle" | "visible";

export interface IslandProps<P extends object> {
  /** Name used to find the component in the client registry (the file name in `src/islands`). */
  name: string;
  component: (props: P) => JSXElement;
  /** Props for the component. They are written into the HTML as JSON, so they must be serializable. */
  props?: P | undefined;
  /** When the browser mounts it: right away, when idle, or when visible (default). */
  load?: IslandLoad | undefined;
}

/** Render an interactive component that the browser mounts later. */
export function Island<P extends object>(props: IslandProps<P>): JSXElement {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("data-jota-island", props.name);
  wrapper.setAttribute("data-jota-load", props.load ?? "visible");
  wrapper.setAttribute("data-jota-props", JSON.stringify(props.props ?? {}));
  wrapper.style.display = "contents";
  insert(wrapper, () =>
    createComponent(props.component as (p: Record<string, unknown>) => JSXElement, (props.props ?? {}) as Record<string, unknown>),
  );
  return wrapper;
}

type Loader = () => unknown;

/** Map of file path -> loader, for example `import.meta.glob("/src/islands/*.tsx")`. */
export type IslandRegistry = Record<string, Loader>;

const MOUNTED = "data-jota-mounted";

function nameOf(path: string): string {
  return (path.split("/").pop() ?? path).replace(/\.[jt]sx?$/, "");
}

async function mountIsland(element: HTMLElement, name: string, loader: Loader): Promise<void> {
  if (element.hasAttribute(MOUNTED)) return;
  element.setAttribute(MOUNTED, "");
  const module = (await loader()) as Record<string, unknown>;
  const component = (module.default ?? module[name]) as ((props: Record<string, unknown>) => JSXElement) | undefined;
  if (typeof component !== "function") {
    console.warn(`Jota: island "${name}" has no default export or export named "${name}".`);
    return;
  }
  const props = JSON.parse(element.getAttribute("data-jota-props") ?? "{}") as Record<string, unknown>;
  element.textContent = "";
  mount(() => createComponent(component, props), element);
}

function schedule(element: HTMLElement, load: IslandLoad, run: () => void): void {
  if (load === "load") {
    run();
  } else if (load === "idle") {
    const idle = (window as unknown as { requestIdleCallback?: (callback: () => void) => number }).requestIdleCallback;
    if (idle) idle.call(window, run);
    else setTimeout(run, 1);
  } else if (typeof IntersectionObserver === "undefined") {
    run();
  } else {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        run();
      }
    });
    observer.observe(element);
  }
}

/**
 * Find the islands in the page and mount each one when its `load` mode says so.
 * Returns how many islands were found, so an entry file can fall back to something else:
 * `if (!startIslands(import.meta.glob("/src/islands/*.tsx"))) startRouter(...)`.
 */
export function startIslands(registry: IslandRegistry, root: ParentNode = document): number {
  const loaders = new Map<string, Loader>();
  for (const [path, loader] of Object.entries(registry)) loaders.set(nameOf(path), loader);

  const elements = [...root.querySelectorAll<HTMLElement>(`[data-jota-island]:not([${MOUNTED}])`)];
  for (const element of elements) {
    const name = element.getAttribute("data-jota-island") ?? "";
    const loader = loaders.get(name);
    if (!loader) {
      console.warn(`Jota: no island named "${name}" in the registry.`);
      continue;
    }
    const load = (element.getAttribute("data-jota-load") ?? "visible") as IslandLoad;
    schedule(element, load, () => {
      mountIsland(element, name, loader).catch((error: unknown) => console.error(error));
    });
  }
  return elements.length;
}
