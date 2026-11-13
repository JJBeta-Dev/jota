import { batch, effect, onCleanup, signal, untrack, type Accessor } from "./reactive.js";

export interface ResourceOptions<T, S> {
  /** Value shown before the first load finishes. */
  initialValue?: T;
  /** Share results between resources: loads with the same key reuse the stored value. */
  cacheKey?: (source: S) => string;
  /** How long a stored value counts as fresh, in milliseconds. Default: 0 (always load again, show the stored value meanwhile). */
  staleTime?: number;
}

export interface Resource<T> {
  /** The latest value, or undefined (or `initialValue`) before the first load. */
  data: Accessor<T | undefined>;
  loading: Accessor<boolean>;
  /** What the last load threw, or undefined. */
  error: Accessor<unknown>;
  /** Load again with the current source. */
  refetch: () => Promise<void>;
  /** Replace the value by hand, for example after saving a form. */
  mutate: (value: T | undefined) => void;
}

export interface FetchInfo {
  /**
   * Aborted when the source changes or the resource is disposed: pass it to `fetch`.
   * Requests with a `cacheKey` are shared between resources, so they are left to finish.
   */
  signal: AbortSignal;
}

const cache = new Map<string, { value: unknown; time: number }>();
const listeners = new Map<string, Set<() => void>>();
const pending = new Map<string, Promise<unknown>>();

/** Forget stored values: one key, every key that starts with a prefix (`"users/"`), or all of them. Live resources load again. */
export function invalidate(key?: string): void {
  for (const stored of [...cache.keys()]) {
    if (key === undefined || stored === key || stored.startsWith(key)) cache.delete(stored);
  }
  for (const [stored, callbacks] of [...listeners]) {
    if (key === undefined || stored === key || stored.startsWith(key)) for (const callback of [...callbacks]) callback();
  }
}

/**
 * Async data as signals. `createResource(fetcher)` loads once; `createResource(source, fetcher)` loads
 * again whenever `source()` changes and skips loading while it is `undefined`, `null` or `false`.
 * A slow answer never overwrites a newer one.
 */
export function createResource<T>(fetcher: (source: true, info: FetchInfo) => Promise<T>, options?: ResourceOptions<T, true>): Resource<T>;
export function createResource<T, S>(
  source: Accessor<S | undefined | null | false>,
  fetcher: (source: S, info: FetchInfo) => Promise<T>,
  options?: ResourceOptions<T, S>,
): Resource<T>;
export function createResource<T, S>(
  first: Accessor<S | undefined | null | false> | ((source: S, info: FetchInfo) => Promise<T>),
  second?: ((source: S, info: FetchInfo) => Promise<T>) | ResourceOptions<T, S>,
  third?: ResourceOptions<T, S>,
): Resource<T> {
  const hasSource = typeof second === "function";
  const source = (hasSource ? first : () => true) as Accessor<S | undefined | null | false>;
  const fetcher = (hasSource ? second : first) as (source: S, info: FetchInfo) => Promise<T>;
  const options = ((hasSource ? third : second) ?? {}) as ResourceOptions<T, S>;

  const [data, setData] = signal<T | undefined>(options.initialValue, { equals: false });
  const [loading, setLoading] = signal(false);
  const [error, setError] = signal<unknown>(undefined, { equals: false });
  let run = 0;
  let controller: AbortController | undefined;
  let watched: string | undefined;

  const unwatch = () => {
    if (watched !== undefined) listeners.get(watched)?.delete(reload);
    watched = undefined;
  };

  async function load(value: S | undefined | null | false, force: boolean): Promise<void> {
    controller?.abort();
    unwatch();
    const current = ++run;
    if (value === undefined || value === null || value === false) {
      setLoading(false);
      return;
    }
    const key = options.cacheKey?.(value);
    if (key !== undefined) {
      watched = key;
      let callbacks = listeners.get(key);
      if (!callbacks) listeners.set(key, (callbacks = new Set()));
      callbacks.add(reload);
      const stored = cache.get(key);
      if (stored && !force) {
        setData(() => stored.value as T);
        if (Date.now() - stored.time < (options.staleTime ?? 0)) {
          batch(() => {
            setError(undefined);
            setLoading(false);
          });
          return;
        }
      }
    }
    controller = new AbortController();
    batch(() => {
      setError(undefined);
      setLoading(true);
    });
    try {
      let request = key === undefined ? undefined : (pending.get(key) as Promise<T> | undefined);
      if (!request) {
        request = fetcher(value, { signal: controller.signal });
        if (key !== undefined) {
          pending.set(key, request);
          const done = () => void (pending.get(key) === request && pending.delete(key));
          request.then(done, done);
        }
      }
      const result = await request;
      if (current !== run) return;
      if (key !== undefined) cache.set(key, { value: result, time: Date.now() });
      batch(() => {
        setData(() => result);
        setLoading(false);
      });
    } catch (failure) {
      if (current !== run) return;
      batch(() => {
        setError(failure);
        setLoading(false);
      });
    }
  }

  function reload(): void {
    void load(untrack(source), true);
  }

  effect(() => {
    const value = source();
    untrack(() => void load(value, false));
  });
  onCleanup(() => {
    run++;
    controller?.abort();
    unwatch();
  });

  return {
    data,
    loading,
    error,
    refetch: () => load(untrack(source), true),
    mutate: (value) => void setData(() => value),
  };
}
