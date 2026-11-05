/**
 * File-based routing for Jota.
 *
 * Route files live in `src/routes`:
 *   index.tsx          -> /
 *   about.tsx          -> /about
 *   blog/index.tsx     -> /blog
 *   blog/[slug].tsx    -> /blog/:slug
 *   docs/[...rest].tsx -> /docs/*rest   (catch-all)
 *   _layout.tsx        -> ignored (files and folders starting with "_" are not routes)
 *
 * `createRoutes` and `matchRoute` are pure and also used by the static build.
 * `startRouter` adds client-side navigation on top.
 */
import { signal } from "./reactive.js";
import { createComponent, mount } from "./web.js";
import type { JSXElement } from "./types.js";

export type Params = Record<string, string>;

export interface Head {
  title?: string;
  description?: string;
  lang?: string;
}

export interface RouteConfig {
  /** "static" (default): HTML only, no JavaScript. "client": the page also loads JavaScript. */
  render?: "static" | "client";
}

export interface RouteModule {
  default: (props: { params: Params }) => JSXElement;
  config?: RouteConfig;
  head?: Head | ((params: Params) => Head);
  /** For dynamic routes: the parameter sets to pre-render. */
  paths?: () => Params[] | Promise<Params[]>;
}

export type RouteLoader = () => RouteModule | Promise<RouteModule>;

export interface Route {
  pattern: string;
  file: string;
  load: RouteLoader;
}

const EXTENSION = /\.(?:[jt]sx?)$/;

/** Turn a route file path into a URL pattern, or null when the file is not a route. */
export function filePathToPattern(file: string, root = "/src/routes"): string | null {
  const normalized = file.replaceAll("\\", "/");
  const rootIndex = normalized.indexOf(root.endsWith("/") ? root : `${root}/`);
  const relative = rootIndex === -1 ? normalized.replace(/^\.?\//, "") : normalized.slice(rootIndex + root.length).replace(/^\//, "");
  if (!EXTENSION.test(relative)) return null;

  const segments = relative.replace(EXTENSION, "").split("/");
  if (segments.some((segment) => segment.startsWith("_") || segment === "")) return null;
  if (segments[segments.length - 1] === "index") segments.pop();

  const parts = segments.map((segment) => {
    const catchAll = /^\[\.\.\.(\w+)\]$/.exec(segment);
    if (catchAll) return `*${catchAll[1]}`;
    const param = /^\[(\w+)\]$/.exec(segment);
    if (param) return `:${param[1]}`;
    return segment;
  });
  return `/${parts.join("/")}`;
}

function specificity(pattern: string): number[] {
  return pattern
    .split("/")
    .filter(Boolean)
    .map((segment) => (segment.startsWith("*") ? 1 : segment.startsWith(":") ? 2 : 3));
}

/** Build the route table from a map of file path -> loader (for example `import.meta.glob`). */
export function createRoutes(modules: Record<string, () => unknown>, root = "/src/routes"): Route[] {
  const routes: Route[] = [];
  for (const [file, load] of Object.entries(modules)) {
    const pattern = filePathToPattern(file, root);
    if (pattern !== null) routes.push({ pattern, file, load: load as RouteLoader });
  }
  return routes.sort((a, b) => {
    if (a.pattern === "/" || b.pattern === "/") return a.pattern === b.pattern ? 0 : a.pattern === "/" ? -1 : 1;
    const sa = specificity(a.pattern);
    const sb = specificity(b.pattern);
    for (let i = 0; i < Math.max(sa.length, sb.length); i++) {
      const diff = (sb[i] ?? 0) - (sa[i] ?? 0);
      if (diff !== 0) return diff;
    }
    return a.pattern.localeCompare(b.pattern);
  });
}

export function normalizePathname(pathname: string): string {
  const path = pathname.split(/[?#]/)[0] || "/";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, "") || "/" : withSlash;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export interface RouteMatch {
  route: Route;
  params: Params;
}

/** Find the route for a pathname. Static segments beat parameters, which beat catch-alls. */
export function matchRoute(routes: Route[], pathname: string): RouteMatch | null {
  const parts = normalizePathname(pathname).split("/").filter(Boolean);
  for (const route of routes) {
    const pattern = route.pattern.split("/").filter(Boolean);
    const params: Params = {};
    let matched = true;
    for (let i = 0; i < pattern.length; i++) {
      const segment = pattern[i] as string;
      if (segment.startsWith("*")) {
        const rest = parts.slice(i);
        if (rest.length === 0) {
          matched = false;
        } else {
          params[segment.slice(1)] = rest.map(safeDecode).join("/");
        }
        // A catch-all consumes everything that is left.
        if (matched) return { route, params };
        break;
      }
      const part = parts[i];
      if (part === undefined) {
        matched = false;
        break;
      }
      if (segment.startsWith(":")) params[segment.slice(1)] = safeDecode(part);
      else if (segment !== part) {
        matched = false;
        break;
      }
    }
    if (matched && pattern.length === parts.length) return { route, params };
  }
  return null;
}

/** Fill a pattern with parameters: ("/blog/:slug", {slug: "a"}) -> "/blog/a". */
export function buildPath(pattern: string, params: Params = {}): string {
  const path = pattern
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      if (segment.startsWith(":") || segment.startsWith("*")) {
        const value = params[segment.slice(1)];
        if (value === undefined) throw new Error(`Missing parameter "${segment.slice(1)}" for route ${pattern}`);
        return segment.startsWith("*") ? value.split("/").map(encodeURIComponent).join("/") : encodeURIComponent(value);
      }
      return segment;
    })
    .join("/");
  return `/${path}`;
}

export function resolveHead(module: RouteModule, params: Params): Head {
  return typeof module.head === "function" ? module.head(params) : (module.head ?? {});
}

// --- client router -------------------------------------------------------------------------

export interface RouterOptions {
  /** Rendered when no route matches. */
  notFound?: () => JSXElement;
}

function isModifiedClick(event: MouseEvent): boolean {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function localHref(anchor: HTMLAnchorElement): string | null {
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || anchor.hasAttribute("download")) return null;
  const target = anchor.getAttribute("target");
  if (target && target !== "_self") return null;
  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  return url.pathname + url.search + url.hash;
}

export interface Router {
  navigate: (to: string) => void;
  /** Stop listening and unmount the current page. */
  dispose: () => void;
}

/**
 * Start client-side routing inside `element`: renders the matching route, handles back/forward and
 * turns clicks on same-origin links into navigations without a page load.
 */
export function startRouter(routes: Route[], element: Element, options: RouterOptions = {}): Router {
  const [pathname, setPathname] = signal(normalizePathname(window.location.pathname));
  const [view, setView] = signal<JSXElement>(null);
  let token = 0;

  const show = (path: string): void => {
    const current = ++token;
    const found = matchRoute(routes, path);
    if (!found) {
      setView(options.notFound ? () => options.notFound?.() : null);
      return;
    }
    Promise.resolve(found.route.load()).then((module) => {
      if (current !== token) return; // a newer navigation won
      const head = resolveHead(module, found.params);
      if (head.title) document.title = head.title;
      setView(() => createComponent(module.default, { params: found.params }));
    });
  };

  const apply = (): void => {
    const path = normalizePathname(window.location.pathname);
    setPathname(path);
    show(path);
  };

  const navigate = (to: string): void => {
    const url = new URL(to, window.location.href);
    window.history.pushState(null, "", url.pathname + url.search + url.hash);
    apply();
    window.scrollTo?.(0, 0);
  };

  const onClick = (event: Event): void => {
    const mouse = event as MouseEvent;
    if (mouse.defaultPrevented || isModifiedClick(mouse)) return;
    const anchor = (event.target as Element | null)?.closest?.("a");
    if (!anchor) return;
    const href = localHref(anchor as HTMLAnchorElement);
    if (href === null) return;
    event.preventDefault();
    navigate(href);
  };

  window.addEventListener("popstate", apply);
  document.addEventListener("click", onClick);
  const unmount = mount(() => view, element);
  show(pathname());

  return {
    navigate,
    dispose: () => {
      token++;
      window.removeEventListener("popstate", apply);
      document.removeEventListener("click", onClick);
      unmount();
    },
  };
}
