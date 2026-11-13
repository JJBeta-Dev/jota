/**
 * Islands: interactive components inside otherwise static pages.
 *
 * `<Island>` renders a component into HTML at build time, wrapped in an element that records which
 * component it is and its props. In the browser, `startIslands` finds those wrappers and hydrates
 * each one when the island loads, the browser is idle, or the island scrolls into view: the server
 * elements are kept and only behaviour is attached. If the HTML does not match what the component
 * builds, the island is mounted from scratch and what the user already typed, checked or focused
 * inside it is carried over. Pages without islands keep shipping no JavaScript.
 */
import { createComponent, hydrate, insert, markIsland, mount } from "./web.js";
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
  markIsland(() =>
    insert(wrapper, () =>
      createComponent(props.component as (p: Record<string, unknown>) => JSXElement, (props.props ?? {}) as Record<string, unknown>),
    ),
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

const CONTROLS = "input, textarea, select";
const FOCUSABLE = "input, textarea, select, button, a[href], [tabindex]";

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

interface Snapshot {
  /** Controls the user changed before the island mounted, by position inside the island. */
  changes: Array<{ index: number; value: string; checked: boolean }>;
  focusIndex: number;
  selection: [number | null, number | null] | null;
}

/** What the user already did inside the server HTML: typed values, checked boxes, focus, caret. */
function snapshot(element: HTMLElement): Snapshot {
  const changes: Snapshot["changes"] = [];
  element.querySelectorAll<Control>(CONTROLS).forEach((control, index) => {
    const input = control as HTMLInputElement;
    const changed =
      control instanceof HTMLSelectElement
        ? [...control.options].some((option) => option.selected !== option.defaultSelected)
        : input.type === "checkbox" || input.type === "radio"
          ? input.checked !== input.defaultChecked
          : control.value !== control.defaultValue;
    if (changed) changes.push({ index, value: control.value, checked: input.checked });
  });
  const active = document.activeElement;
  const focusIndex = active && element.contains(active) ? [...element.querySelectorAll(FOCUSABLE)].indexOf(active) : -1;
  const selection =
    focusIndex >= 0 && active instanceof HTMLInputElement && active.type !== "checkbox" && active.type !== "radio"
      ? ([active.selectionStart, active.selectionEnd] as [number | null, number | null])
      : null;
  return { changes, focusIndex, selection };
}

/** Put the user's state back into the freshly mounted DOM, telling the component through events. */
function restore(element: HTMLElement, state: Snapshot): void {
  const controls = element.querySelectorAll<Control>(CONTROLS);
  for (const change of state.changes) {
    const control = controls[change.index];
    if (!control) continue;
    const input = control as HTMLInputElement;
    if (input.type === "checkbox" || input.type === "radio") {
      if (input.checked === change.checked) continue;
      input.checked = change.checked;
    } else {
      if (control.value === change.value) continue;
      control.value = change.value;
    }
    control.dispatchEvent(new Event("input", { bubbles: true }));
    control.dispatchEvent(new Event("change", { bubbles: true }));
  }
  if (state.focusIndex >= 0) {
    const target = element.querySelectorAll<HTMLElement>(FOCUSABLE)[state.focusIndex];
    if (target) {
      target.focus();
      if (state.selection && target instanceof HTMLInputElement) {
        try {
          target.setSelectionRange(state.selection[0], state.selection[1]);
        } catch {
        }
      }
    }
  }
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
  const state = snapshot(element);
  if (hydrate(() => createComponent(component, props), element)) return;
  element.textContent = "";
  mount(() => createComponent(component, props), element);
  restore(element, state);
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
