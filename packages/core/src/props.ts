type AnyProps = Record<PropertyKey, unknown>;

function resolve(source: unknown): AnyProps | undefined {
  const value = typeof source === "function" ? (source as () => unknown)() : source;
  return value && typeof value === "object" ? (value as AnyProps) : undefined;
}

/**
 * Combine several props objects into one live view. Later sources win, getters stay lazy, so
 * reactive props keep working after merging.
 */
export function mergeProps(...sources: unknown[]): AnyProps {
  const find = (key: PropertyKey): AnyProps | undefined => {
    for (let i = sources.length - 1; i >= 0; i--) {
      const value = resolve(sources[i]);
      if (value && key in value) return value;
    }
    return undefined;
  };

  return new Proxy({} as AnyProps, {
    get: (_target, key) => find(key)?.[key],
    has: (_target, key) => find(key) !== undefined,
    ownKeys: () => {
      const keys = new Set<string | symbol>();
      for (const source of sources) {
        const value = resolve(source);
        if (value) for (const key of Reflect.ownKeys(value)) keys.add(key);
      }
      return [...keys];
    },
    getOwnPropertyDescriptor: (_target, key) =>
      find(key) ? { enumerable: true, configurable: true } : undefined,
  });
}

/**
 * Split props into groups by key. Returns one object per key list plus a final object with the
 * remaining props. Values stay lazy, so reactivity is preserved.
 */
export function splitProps(props: object, ...keyLists: Array<readonly string[]>): AnyProps[] {
  const source = props as AnyProps;
  const define = (target: AnyProps, key: PropertyKey): void => {
    Object.defineProperty(target, key, { get: () => source[key], enumerable: true });
  };

  const used = new Set<PropertyKey>();
  const groups = keyLists.map((keys) => {
    const group: AnyProps = {};
    for (const key of keys) {
      used.add(key);
      define(group, key);
    }
    return group;
  });

  const rest: AnyProps = {};
  for (const key of Reflect.ownKeys(source)) if (!used.has(key)) define(rest, key);
  return [...groups, rest];
}
