/**
 * Jota reactivity core: fine-grained signals, memos and effects.
 *
 * - A signal holds a value and remembers who read it.
 * - A computed (memo) is a cached derived value that only recomputes when a source really changed.
 * - An effect re-runs when the signals it read change. Components run once; effects and DOM
 *   bindings are what update, so nothing re-renders as a whole.
 *
 * Staleness is pushed through the graph, values are pulled (and compared by version) before an
 * effect re-runs, so effects never see inconsistent state and unchanged memos do not trigger work.
 */

export type Accessor<T> = () => T;
export type Setter<T> = (value: T | ((previous: T) => T)) => T;
export type Equals<T> = false | ((a: T, b: T) => boolean);

export interface SignalOptions<T> {
  /** Custom equality. `false` makes every set notify, even with the same value. */
  equals?: Equals<T>;
}

interface Source {
  /** Allocated when the first observer subscribes. */
  observers: Set<Observer> | null;
  version: number;
  refresh?: () => void;
}

interface Observer {
  disposed: boolean;
  sources: Map<Source, number>;
  /** Sources of the previous run while a run is in progress (used to skip re-subscribing). */
  previous: Map<Source, number> | null;
  mark(): void;
}

interface Runnable extends Observer {
  runIfNeeded(): void;
}

const MAX_FLUSH_ITERATIONS = 100_000;

let currentObserver: Observer | null = null;
let currentOwner: Owner | null = null;
let batchDepth = 0;
let flushing = false;
let queue: Runnable[] = [];
let queueHead = 0;

const defaultEquals = <T>(a: T, b: T): boolean => a === b;

function resolveEquals<T>(equals: Equals<T> | undefined): (a: T, b: T) => boolean {
  if (equals === false) return () => false;
  return equals ?? defaultEquals;
}

class Owner {
  parent: Owner | null;
  // Allocated on first use: most computations never own children or cleanups.
  children: Set<Owner> | null = null;
  cleanups: Array<() => void> | null = null;
  disposed = false;

  constructor(parent: Owner | null) {
    this.parent = parent;
    if (parent) (parent.children ??= new Set()).add(this);
  }

  /** Dispose children and run cleanups registered with onCleanup (used before a re-run). */
  cleanup(): void {
    const children = this.children;
    if (children !== null && children.size > 0) {
      const list = [...children];
      children.clear();
      for (const child of list) child.dispose();
    }
    const cleanups = this.cleanups;
    if (cleanups !== null && cleanups.length > 0) {
      this.cleanups = null;
      for (const fn of cleanups) fn();
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.cleanup();
    this.parent?.children?.delete(this);
  }
}

class Computation<T> extends Owner implements Source, Runnable {
  observers: Set<Observer> | null = null;
  sources = new Map<Source, number>();
  previous: Map<Source, number> | null = null;
  private spare: Map<Source, number> | null = null;
  version = 0;
  value: T | undefined;
  stale = false;
  queued = false;
  hasRun = false;
  private readonly equals: (a: T, b: T) => boolean;

  constructor(
    private readonly fn: (previous: T | undefined) => T,
    private readonly isEffect: boolean,
    equals: Equals<T> | undefined,
    initial: T | undefined,
  ) {
    super(currentOwner);
    this.equals = resolveEquals(equals);
    this.value = initial;
  }

  /** A source changed (memo: propagate staleness, effect: schedule). */
  mark(): void {
    if (this.disposed) return;
    if (this.isEffect) {
      if (!this.queued) {
        this.queued = true;
        queue.push(this);
      }
    } else if (!this.stale) {
      this.stale = true;
      // Marking only flags memos and queues effects; it never changes the observer sets.
      const observers = this.observers;
      if (observers !== null) for (const observer of observers) observer.mark();
    }
  }

  /** Memo: bring the cached value up to date if a source really changed. */
  refresh(): void {
    if (!this.stale) return;
    this.stale = false;
    if (this.sourcesChanged()) this.execute();
  }

  sourcesChanged(): boolean {
    for (const [source, seen] of this.sources) {
      source.refresh?.();
      if (source.version !== seen) return true;
    }
    return false;
  }

  /** Effect entry point from the queue. */
  runIfNeeded(): void {
    this.queued = false;
    if (this.disposed) return;
    if (this.hasRun && !this.sourcesChanged()) return;
    this.execute();
  }

  execute(): void {
    this.cleanup();
    // Keep the old subscriptions: only sources that are no longer read get unsubscribed afterwards.
    const previous = this.sources;
    this.sources = this.spare ?? new Map();
    this.spare = null;
    this.previous = previous;

    const previousObserver = currentObserver;
    const previousOwner = currentOwner;
    currentObserver = this;
    currentOwner = this;
    try {
      const next = this.fn(this.value);
      if (this.isEffect) {
        this.value = next;
      } else if (!this.hasRun) {
        this.value = next;
      } else if (!this.equals(this.value as T, next)) {
        this.value = next;
        this.version++;
      }
    } finally {
      currentObserver = previousObserver;
      currentOwner = previousOwner;
      this.hasRun = true;
      this.previous = null;
      for (const source of previous.keys()) {
        if (this.disposed || !this.sources.has(source)) source.observers?.delete(this);
      }
      previous.clear();
      this.spare = previous;
    }
  }

  override dispose(): void {
    if (this.disposed) return;
    for (const source of this.sources.keys()) source.observers?.delete(this);
    this.sources.clear();
    this.observers?.clear();
    super.dispose();
  }
}

function track(source: Source): void {
  const observer = currentObserver;
  if (!observer || observer.disposed) return;
  const previous = observer.previous;
  if (previous === null || !previous.has(source)) (source.observers ??= new Set()).add(observer);
  observer.sources.set(source, source.version);
}

function flush(): void {
  if (flushing) return;
  flushing = true;
  try {
    let iterations = 0;
    while (queueHead < queue.length) {
      if (++iterations > MAX_FLUSH_ITERATIONS) {
        throw new Error("Jota: infinite update loop detected (an effect keeps changing its own sources).");
      }
      const next = queue[queueHead++] as Runnable;
      next.runIfNeeded();
    }
  } finally {
    queue = [];
    queueHead = 0;
    flushing = false;
  }
}

/** Create a reactive value. Returns a `[get, set]` pair. */
export function signal<T>(initial: T, options?: SignalOptions<T>): [Accessor<T>, Setter<T>] {
  const equals = resolveEquals(options?.equals);
  const node: Source & { value: T } = { value: initial, version: 0, observers: null };

  const get: Accessor<T> = () => {
    track(node);
    return node.value;
  };

  const set: Setter<T> = (input) => {
    const next = typeof input === "function" ? (input as (previous: T) => T)(node.value) : input;
    if (equals(node.value, next)) return node.value;
    node.value = next;
    node.version++;
    const observers = node.observers;
    if (observers !== null) for (const observer of observers) observer.mark();
    if (batchDepth === 0) flush();
    return next;
  };

  return [get, set];
}

/** Cached derived value. Recomputes only when a source it read really changed. */
export function computed<T>(fn: (previous: T | undefined) => T, equals?: Equals<T>): Accessor<T> {
  const computation = new Computation<T>(fn, false, equals, undefined);
  computation.execute();
  return () => {
    computation.refresh();
    track(computation);
    return computation.value as T;
  };
}

/** Run `fn` now and again whenever the signals it read change. Returns a dispose function. */
export function effect<T>(fn: (previous: T | undefined) => T, initial?: T): () => void {
  const computation = new Computation<T>(fn, true, undefined, initial);
  computation.execute();
  return () => computation.dispose();
}

/** Group several signal writes so effects run once at the end. */
export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) flush();
  }
}

/** Read signals inside `fn` without subscribing the current effect to them. */
export function untrack<T>(fn: () => T): T {
  const previous = currentObserver;
  currentObserver = null;
  try {
    return fn();
  } finally {
    currentObserver = previous;
  }
}

/** Create an independent ownership scope. Call the given `dispose` to stop everything inside. */
export function createRoot<T>(fn: (dispose: () => void) => T): T {
  const owner = new Owner(null);
  const previousOwner = currentOwner;
  const previousObserver = currentObserver;
  currentOwner = owner;
  currentObserver = null;
  try {
    return fn(() => owner.dispose());
  } finally {
    currentOwner = previousOwner;
    currentObserver = previousObserver;
  }
}

/** Register a function to run when the current effect re-runs or its scope is disposed. */
export function onCleanup(fn: () => void): void {
  if (currentOwner) (currentOwner.cleanups ??= []).push(fn);
}
