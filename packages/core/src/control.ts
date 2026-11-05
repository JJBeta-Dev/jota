import { computed, createRoot, onCleanup, signal, untrack, type Accessor } from "./reactive.js";
import type { JSXElement } from "./types.js";

interface ShowProps<T> {
  when: T | undefined | null | false;
  fallback?: JSXElement;
  children?: JSXElement | ((item: NonNullable<T>) => JSXElement);
}

/** Render `children` while `when` is truthy, otherwise `fallback`. Children are only created when shown. */
export function Show<T>(props: ShowProps<T>): JSXElement {
  const truthy = computed(() => Boolean(props.when));
  return computed(() => {
    if (!truthy()) return props.fallback;
    return untrack(() => {
      const children = props.children;
      return typeof children === "function" && children.length > 0
        ? (children as (item: NonNullable<T>) => JSXElement)(props.when as NonNullable<T>)
        : (children as JSXElement);
    });
  }) as unknown as JSXElement;
}

interface ForProps<T> {
  each: readonly T[] | undefined | null | false;
  fallback?: JSXElement;
  children: (item: T, index: Accessor<number>) => JSXElement;
}

interface Entry {
  value: JSXElement;
  dispose: () => void;
  setIndex: (index: number) => void;
}

/**
 * Render a list. Each item is rendered once and reused while it stays in the list (matched by
 * identity), so adding, removing or reordering items does not rebuild the others.
 */
export function For<T>(props: ForProps<T>): JSXElement {
  let previous = new Map<T, Entry[]>();

  onCleanup(() => {
    for (const bucket of previous.values()) for (const entry of bucket) entry.dispose();
    previous = new Map();
  });

  const createEntry = (item: T, index: number): Entry =>
    createRoot((dispose) => {
      const [position, setPosition] = signal(index);
      const value = props.children(item, position);
      return { value, dispose, setIndex: (next: number) => void setPosition(next) };
    });

  return computed(() => {
    const items = props.each || [];
    return untrack(() => {
      const next = new Map<T, Entry[]>();
      const result: JSXElement[] = [];
      items.forEach((item, index) => {
        let entry = previous.get(item)?.shift();
        if (entry) entry.setIndex(index);
        else entry = createEntry(item, index);
        const bucket = next.get(item);
        if (bucket) bucket.push(entry);
        else next.set(item, [entry]);
        result.push(entry.value);
      });
      for (const bucket of previous.values()) for (const entry of bucket) entry.dispose();
      previous = next;
      return result.length === 0 ? props.fallback : result;
    });
  }) as unknown as JSXElement;
}
