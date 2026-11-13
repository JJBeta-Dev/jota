import { signal, type Accessor } from "./reactive.js";

let counter = 0;
const nextId = (prefix: string) => `${prefix}-${++counter}`;

export interface Disclosure {
  open: Accessor<boolean>;
  toggle: () => void;
  /** Spread on the `<button>` that shows and hides the panel. */
  trigger: { type: "button"; "aria-expanded": "true" | "false"; "aria-controls": string; onClick: () => void };
  /** Spread on the element that is shown and hidden. */
  panel: { id: string; hidden: boolean };
}

/** A button that shows and hides a region (accordion item, "read more", menu section). */
export function createDisclosure(options: { open?: boolean; id?: string } = {}): Disclosure {
  const [open, setOpen] = signal(options.open ?? false);
  const id = options.id ?? nextId("disclosure");
  const toggle = () => void setOpen((current) => !current);
  return {
    open,
    toggle,
    trigger: {
      type: "button",
      get "aria-expanded"() {
        return open() ? ("true" as const) : ("false" as const);
      },
      "aria-controls": id,
      onClick: toggle,
    },
    panel: {
      id,
      get hidden() {
        return !open();
      },
    },
  };
}

export interface Tabs<K extends string> {
  selected: Accessor<K>;
  select: (key: K) => void;
  /** Spread on the element that contains the tab buttons. Give it an `aria-label`. */
  list: { role: "tablist"; onKeyDown: (event: KeyboardEvent) => void };
  /** Spread on each tab `<button>`. */
  tab: (key: K) => {
    type: "button";
    role: "tab";
    id: string;
    "aria-selected": "true" | "false";
    "aria-controls": string;
    tabIndex: number;
    onClick: () => void;
  };
  /** Spread on each panel. */
  panel: (key: K) => { role: "tabpanel"; id: string; "aria-labelledby": string; tabIndex: number; hidden: boolean };
}

/**
 * Tabs with the keyboard behavior people expect: one tab stop, arrow keys move between tabs and
 * select them, Home and End jump to the first and last.
 */
export function createTabs<K extends string>(options: { tabs: readonly K[]; selected?: K; id?: string }): Tabs<K> {
  const keys = options.tabs;
  if (keys.length === 0) throw new Error("Jota: createTabs needs at least one tab.");
  const id = options.id ?? nextId("tabs");
  const [selected, setSelected] = signal<K>(options.selected ?? (keys[0] as K));
  const select = (key: K) => void setSelected(() => key);

  function onKeyDown(event: KeyboardEvent): void {
    const index = keys.indexOf(selected());
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % keys.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + keys.length) % keys.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = keys.length - 1;
    else return;
    event.preventDefault();
    const key = keys[next] as K;
    select(key);
    document.getElementById(`${id}-tab-${key}`)?.focus();
  }

  return {
    selected,
    select,
    list: { role: "tablist", onKeyDown },
    tab: (key) => ({
      type: "button",
      role: "tab",
      id: `${id}-tab-${key}`,
      get "aria-selected"() {
        return selected() === key ? ("true" as const) : ("false" as const);
      },
      "aria-controls": `${id}-panel-${key}`,
      get tabIndex() {
        return selected() === key ? 0 : -1;
      },
      onClick: () => select(key),
    }),
    panel: (key) => ({
      role: "tabpanel",
      id: `${id}-panel-${key}`,
      "aria-labelledby": `${id}-tab-${key}`,
      tabIndex: 0,
      get hidden() {
        return selected() !== key;
      },
    }),
  };
}

export interface Dialog {
  open: Accessor<boolean>;
  /** Open as a modal. Focus moves inside; the rest of the page cannot be reached until it closes. */
  show: () => void;
  close: () => void;
  /** Spread on the `<dialog>` element. */
  dialog: { ref: (element: HTMLDialogElement) => void; "aria-labelledby": string; onClose: () => void };
  /** Spread on the heading inside the dialog: it becomes the dialog's name. */
  title: { id: string };
}

/**
 * A modal dialog on top of the native `<dialog>` element: the browser traps focus, closes on Escape
 * and hides the page behind from assistive technology. Focus returns to the element that opened it.
 */
export function createDialog(options: { id?: string } = {}): Dialog {
  const id = options.id ?? nextId("dialog");
  const [open, setOpen] = signal(false);
  let element: HTMLDialogElement | undefined;
  let opener: HTMLElement | null = null;

  return {
    open,
    show() {
      if (!element || element.open) return;
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      element.showModal();
      setOpen(true);
    },
    close() {
      element?.close();
    },
    dialog: {
      ref: (node) => void (element = node),
      "aria-labelledby": `${id}-title`,
      onClose() {
        setOpen(false);
        opener?.focus();
        opener = null;
      },
    },
    title: { id: `${id}-title` },
  };
}
