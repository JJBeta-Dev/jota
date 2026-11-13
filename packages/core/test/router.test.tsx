import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildPath,
  createRoutes,
  filePathToPattern,
  matchRoute,
  normalizePathname,
  startRouter,
  type RouteModule,
} from "../src/router.js";

const page = (text: string): RouteModule => ({
  default: () => {
    const p = document.createElement("p");
    p.textContent = text;
    return p;
  },
});

describe("filePathToPattern", () => {
  it("maps files to URL patterns", () => {
    expect(filePathToPattern("/src/routes/index.tsx")).toBe("/");
    expect(filePathToPattern("/src/routes/about.tsx")).toBe("/about");
    expect(filePathToPattern("/src/routes/blog/index.tsx")).toBe("/blog");
    expect(filePathToPattern("/src/routes/blog/[slug].tsx")).toBe("/blog/:slug");
    expect(filePathToPattern("/src/routes/docs/[...rest].jsx")).toBe("/docs/*rest");
    expect(filePathToPattern("./src/routes/a/b/c.ts")).toBe("/a/b/c");
  });

  it("ignores files and folders starting with an underscore, and non-code files", () => {
    expect(filePathToPattern("/src/routes/_layout.tsx")).toBeNull();
    expect(filePathToPattern("/src/routes/_private/page.tsx")).toBeNull();
    expect(filePathToPattern("/src/routes/readme.md")).toBeNull();
  });

  it("accepts Windows separators and a custom root", () => {
    expect(filePathToPattern("C:\\app\\src\\routes\\blog\\[slug].tsx", "/src/routes")).toBe("/blog/:slug");
    expect(filePathToPattern("/pages/a.tsx", "/pages")).toBe("/a");
  });
});

describe("createRoutes and matchRoute", () => {
  const load = () => page("x");
  const routes = createRoutes({
    "/src/routes/index.tsx": load,
    "/src/routes/blog/[slug].tsx": load,
    "/src/routes/blog/new.tsx": load,
    "/src/routes/docs/[...rest].tsx": load,
    "/src/routes/_skip.tsx": load,
  });

  it("skips non-route files and puts static before params before catch-alls", () => {
    expect(routes.map((r) => r.pattern)).toEqual(["/", "/blog/new", "/blog/:slug", "/docs/*rest"]);
  });

  it("matches static routes, params and catch-alls", () => {
    expect(matchRoute(routes, "/")?.route.pattern).toBe("/");
    expect(matchRoute(routes, "/blog/new")?.route.pattern).toBe("/blog/new");
    expect(matchRoute(routes, "/blog/hello")).toMatchObject({ params: { slug: "hello" } });
    expect(matchRoute(routes, "/docs/a/b/c")).toMatchObject({ params: { rest: "a/b/c" } });
  });

  it("decodes params and ignores trailing slashes, query and hash", () => {
    expect(matchRoute(routes, "/blog/hola%20mundo/?x=1#top")).toMatchObject({ params: { slug: "hola mundo" } });
  });

  it("returns null when nothing matches", () => {
    expect(matchRoute(routes, "/nope")).toBeNull();
    expect(matchRoute(routes, "/blog")).toBeNull();
    expect(matchRoute(routes, "/blog/a/b")).toBeNull();
    expect(matchRoute(routes, "/docs")).toBeNull();
  });
});

describe("helpers", () => {
  it("normalizes pathnames", () => {
    expect(normalizePathname("/a/b/")).toBe("/a/b");
    expect(normalizePathname("/")).toBe("/");
    expect(normalizePathname("a")).toBe("/a");
    expect(normalizePathname("/a?x=1#y")).toBe("/a");
  });

  it("builds paths from patterns", () => {
    expect(buildPath("/")).toBe("/");
    expect(buildPath("/blog/:slug", { slug: "hola mundo" })).toBe("/blog/hola%20mundo");
    expect(buildPath("/docs/*rest", { rest: "a/b" })).toBe("/docs/a/b");
    expect(() => buildPath("/blog/:slug", {})).toThrow(/slug/);
  });
});

describe("startRouter", () => {
  let container: HTMLElement;
  let stop: (() => void) | undefined;

  beforeEach(() => {
    window.history.pushState(null, "", "/");
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    stop?.();
    stop = undefined;
    container.remove();
  });

  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  const routes = createRoutes({
    "/src/routes/index.tsx": () => page("home"),
    "/src/routes/about.tsx": () => ({
      ...page("about"),
      head: { title: "About page" },
    }),
    "/src/routes/user/[id].tsx": () => ({
      default: ({ params }: { params: Record<string, string> }) => {
        const p = document.createElement("p");
        p.textContent = `user ${params.id}`;
        return p;
      },
    }),
  });

  it("renders the matching route and navigates without reloading", async () => {
    const router = startRouter(routes, container);
    stop = router.dispose;
    await flush();
    expect(container.textContent).toBe("home");

    router.navigate("/about");
    await flush();
    expect(container.textContent).toBe("about");
    expect(window.location.pathname).toBe("/about");
    expect(document.title).toBe("About page");

    router.navigate("/user/42");
    await flush();
    expect(container.textContent).toBe("user 42");
  });

  it("follows clicks on same-origin links and leaves modified clicks alone", async () => {
    const router = startRouter(routes, container);
    stop = router.dispose;
    await flush();

    const link = document.createElement("a");
    link.setAttribute("href", "/about");
    document.body.appendChild(link);

    link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true }));
    await flush();
    expect(container.textContent).toBe("home");

    link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await flush();
    expect(container.textContent).toBe("about");
    link.remove();
  });

  it("does not hijack external links, targets or downloads", async () => {
    const router = startRouter(routes, container);
    stop = router.dispose;
    await flush();

    for (const attrs of [
      { href: "https://example.com/about" },
      { href: "/about", target: "_blank" },
      { href: "/about", download: "" },
      { href: "#section" },
    ]) {
      const link = document.createElement("a");
      for (const [key, value] of Object.entries(attrs)) link.setAttribute(key, value);
      document.body.appendChild(link);
      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      link.dispatchEvent(event);
      /** Not prevented means the router did not take over (the browser would navigate). */
      expect(event.defaultPrevented).toBe(false);
      link.remove();
    }
    expect(container.textContent).toBe("home");
  });

  it("shows notFound for unknown paths", async () => {
    window.history.pushState(null, "", "/missing");
    const router = startRouter(routes, container, {
      notFound: () => {
        const p = document.createElement("p");
        p.textContent = "404";
        return p;
      },
    });
    stop = router.dispose;
    await flush();
    expect(container.textContent).toBe("404");
  });

  it("the latest navigation wins when loaders are slow", async () => {
    const slow = createRoutes({
      "/src/routes/index.tsx": () => page("home"),
      "/src/routes/slow.tsx": () => new Promise<RouteModule>((resolve) => setTimeout(() => resolve(page("slow")), 30)),
      "/src/routes/fast.tsx": () => page("fast"),
    });
    const router = startRouter(slow, container);
    stop = router.dispose;
    await flush();
    router.navigate("/slow");
    router.navigate("/fast");
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(container.textContent).toBe("fast");
  });

  it("awaits load() and passes data to the page and head", async () => {
    const withData = createRoutes({
      "/src/routes/index.tsx": () => page("home"),
      "/src/routes/posts.tsx": () => ({
        default: ({ data }: { params: Record<string, string>; data?: unknown }) => {
          const p = document.createElement("p");
          p.textContent = `posts: ${(data as string[]).join(",")}`;
          return p;
        },
        load: async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return ["a", "b"];
        },
        head: (_params: Record<string, string>, data?: unknown) => ({ title: `${(data as string[]).length} posts` }),
      }),
    });
    const router = startRouter(withData, container);
    stop = router.dispose;
    await flush();
    router.navigate("/posts");
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(container.textContent).toBe("posts: a,b");
    expect(document.title).toBe("2 posts");
  });

  it("shows onError when load() fails", async () => {
    const failing = createRoutes({
      "/src/routes/index.tsx": () => page("home"),
      "/src/routes/bad.tsx": () => ({
        ...page("never"),
        load: () => {
          throw new Error("boom");
        },
      }),
    });
    const router = startRouter(failing, container, {
      onError: (error) => {
        const p = document.createElement("p");
        p.textContent = `error: ${(error as Error).message}`;
        return p;
      },
    });
    stop = router.dispose;
    await flush();
    router.navigate("/bad");
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(container.textContent).toBe("error: boom");
  });

  it("replaces pre-rendered server HTML instead of adding to it", async () => {
    container.innerHTML = "<p>server html</p>";
    const router = startRouter(routes, container);
    stop = router.dispose;
    expect(container.textContent).toBe("server html"); // kept until the route is ready
    await flush();
    expect(container.textContent).toBe("home");
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });

  it("leaves links to pages that are not client routes to the browser", async () => {
    const router = startRouter(routes, container);
    stop = router.dispose;
    await flush();
    const link = document.createElement("a");
    link.setAttribute("href", "/static-page");
    document.body.appendChild(link);
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(container.textContent).toBe("home"); // the router did not take over
    link.remove();
  });
});
