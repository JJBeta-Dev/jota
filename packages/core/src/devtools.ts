import { setDevHook, type DevEvent } from "./reactive.js";

export interface DevtoolsOptions {
  /** Print each event to the console as it happens. Default: false. */
  log?: boolean;
  /** Keep at most this many events. Default: 1000. */
  limit?: number;
}

export interface DevtoolsSummary {
  /** Signal writes, by signal name (unnamed signals are counted together). */
  writes: Record<string, number>;
  /** How many times computeds ran. */
  computed: number;
  /** How many times effects ran: each one is a DOM update or a side effect. */
  effects: number;
}

export interface Devtools {
  events: DevEvent[];
  /** Totals since the start or the last `clear()`. */
  summary: () => DevtoolsSummary;
  /** Run something (for example a click handler) and get what it caused. */
  measure: (work: () => void) => DevtoolsSummary;
  clear: () => void;
  stop: () => void;
}

function summarize(events: DevEvent[]): DevtoolsSummary {
  const summary: DevtoolsSummary = { writes: {}, computed: 0, effects: 0 };
  for (const event of events) {
    if (event.type === "write") {
      const name = event.name ?? "(unnamed)";
      summary.writes[name] = (summary.writes[name] ?? 0) + 1;
    } else if (event.type === "computed") summary.computed++;
    else summary.effects++;
  }
  return summary;
}

/**
 * See what the reactive graph does. Name the signals you care about (`signal(0, { name: "count" })`),
 * call `startDevtools()` in development, and ask `__JOTA_DEVTOOLS__.summary()` in the browser console:
 * it tells how many effects ran, which is how many places of the page were updated.
 */
export function startDevtools(options: DevtoolsOptions = {}): Devtools {
  const limit = options.limit ?? 1000;
  const events: DevEvent[] = [];
  setDevHook((event) => {
    events.push(event);
    if (events.length > limit) events.splice(0, events.length - limit);
    if (options.log) console.log(`[jota] ${event.type}${event.name ? ` ${event.name}` : ""}`, event.type === "effect" ? `(${event.sources} sources)` : event.value);
  });
  const devtools: Devtools = {
    events,
    summary: () => summarize(events),
    measure(work) {
      const start = events.length;
      work();
      return summarize(events.slice(start));
    },
    clear: () => void (events.length = 0),
    stop: () => setDevHook(null),
  };
  (globalThis as { __JOTA_DEVTOOLS__?: Devtools }).__JOTA_DEVTOOLS__ = devtools;
  return devtools;
}
