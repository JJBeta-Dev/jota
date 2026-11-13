import { batch, signal, type Accessor, type Setter } from "./reactive.js";

type Cell = [Accessor<unknown>, Setter<unknown>];

const KEYS = Symbol("keys");
const cells = new WeakMap<object, Map<PropertyKey, Cell>>();
const readers = new WeakMap<object, object>();
const writers = new WeakMap<object, object>();

function isObject(value: unknown): value is object {
  if (value === null || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value) as unknown;
  return prototype === Object.prototype || prototype === null || Array.isArray(value);
}

function cell(target: object, key: PropertyKey): Cell {
  let map = cells.get(target);
  if (!map) cells.set(target, (map = new Map()));
  let found = map.get(key);
  if (!found) map.set(key, (found = signal<unknown>(undefined, { equals: false }) as Cell));
  return found;
}

function notify(target: object, key: PropertyKey): void {
  cells.get(target)?.get(key)?.[1](undefined);
}

function reader<T extends object>(target: T): T {
  const existing = readers.get(target);
  if (existing) return existing as T;
  const proxy = new Proxy(target, {
    get(object, key, receiver) {
      if (typeof key === "symbol") return Reflect.get(object, key, receiver) as unknown;
      cell(object, key)[0]();
      const value = Reflect.get(object, key, receiver) as unknown;
      return isObject(value) ? reader(value) : value;
    },
    has(object, key) {
      cell(object, key)[0]();
      return Reflect.has(object, key);
    },
    ownKeys(object) {
      cell(object, KEYS)[0]();
      return Reflect.ownKeys(object);
    },
    set() {
      throw new Error("Jota: a store is read-only. Change it inside the update function: setStore((draft) => { draft.x = 1 }).");
    },
    deleteProperty() {
      throw new Error("Jota: a store is read-only. Change it inside the update function.");
    },
  });
  readers.set(target, proxy);
  return proxy;
}

function writer<T extends object>(target: T): T {
  const existing = writers.get(target);
  if (existing) return existing as T;
  const proxy = new Proxy(target, {
    get(object, key, receiver) {
      const value = Reflect.get(object, key, receiver) as unknown;
      return isObject(value) ? writer(value) : value;
    },
    set(object, key, value: unknown) {
      const had = Object.prototype.hasOwnProperty.call(object, key);
      const previous = (object as Record<PropertyKey, unknown>)[key];
      const length = Array.isArray(object) ? object.length : -1;
      (object as Record<PropertyKey, unknown>)[key] = value;
      if (!had || previous !== value) notify(object, key);
      if (!had) notify(object, KEYS);
      if (Array.isArray(object) && object.length !== length) notify(object, "length");
      return true;
    },
    deleteProperty(object, key) {
      if (!Object.prototype.hasOwnProperty.call(object, key)) return true;
      delete (object as Record<PropertyKey, unknown>)[key];
      notify(object, key);
      notify(object, KEYS);
      return true;
    },
  });
  writers.set(target, proxy);
  return proxy;
}

export type SetStore<T> = (update: (draft: T) => void) => void;

/**
 * Nested reactive state. Reading `store.user.name` inside JSX or an effect subscribes to that one
 * property. Change it with plain assignments inside the update function; only what changed updates.
 *
 * `const [store, setStore] = createStore({ todos: [] }); setStore((draft) => { draft.todos.push(todo) })`
 */
export function createStore<T extends object>(initial: T): [store: T, setStore: SetStore<T>] {
  if (!isObject(initial)) throw new Error("Jota: createStore needs a plain object or an array.");
  const setStore: SetStore<T> = (update) => batch(() => update(writer(initial)));
  return [reader(initial), setStore];
}
