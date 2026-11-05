/**
 * Static site generation for Jota.
 *
 * After `vite build`, every route in `src/routes` is rendered to HTML and written next to the
 * client build. Pages are static by default and ship no JavaScript; a route opts in with
 * `export const config = { render: "client" }`, which keeps the script tag so the page can become
 * interactive (the client mounts again, it does not hydrate).
 *
 * Also done per page: route `head` (title, description, lang), small stylesheets inlined, first
 * image marked `fetchpriority="high"`, other images `loading="lazy"`, plus `404.html` and an
 * optional `sitemap.xml`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { Window } from "happy-dom";
import type { Plugin, ResolvedConfig } from "vite";
import { transformJota, type JotaOptions } from "./index.js";

export interface StaticOptions {
  /** Folder with route files, relative to the Vite root. Default: "src/routes". */
  routesDir?: string;
  /** Public origin, for example "https://example.com". When set, sitemap.xml is written. */
  site?: string;
  /** Inline stylesheets when their total size is at most this many bytes. Default: 20000. */
  inlineCssLimit?: number;
  /**
   * For stylesheets above `inlineCssLimit`: inline only the CSS each page needs and load the full
   * file without blocking rendering (uses `beasties`). Default: true. The async load adds a small
   * `onload` attribute to the stylesheet link and a `<noscript>` fallback.
   */
  criticalCss?: boolean;
  /** Options for the Jota compiler used while rendering. */
  jota?: JotaOptions;
  /**
   * Convert local JPEG and PNG images to AVIF and WebP (needs the optional `sharp` package) and wrap
   * their `<img>` in a `<picture>`. `true` uses both formats at quality 70.
   */
  images?: boolean | ImageOptions;
}

export interface ImageOptions {
  formats?: Array<"avif" | "webp">;
  quality?: number;
}

interface RouteInfo {
  pattern: string;
  file: string;
}

interface PageModule {
  default: (props: { params: Record<string, string>; data?: unknown }) => unknown;
  config?: { render?: "static" | "client" };
  load?: (context: { params: Record<string, string> }) => unknown | Promise<unknown>;
  head?: Head | ((params: Record<string, string>, data?: unknown) => Head);
  paths?: () => Array<Record<string, string>> | Promise<Array<Record<string, string>>>;
}

interface Head {
  title?: string;
  description?: string;
  lang?: string;
}

interface Router {
  filePathToPattern: (file: string, root?: string) => string | null;
  buildPath: (pattern: string, params?: Record<string, string>) => string;
}

interface WebApi {
  createComponent: (component: PageModule["default"], props: { params: Record<string, string>; data?: unknown }) => unknown;
  mount: (code: () => unknown, element: Element) => () => void;
}

const ROUTE_FILE = /\.[jt]sx?$/;

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (ROUTE_FILE.test(entry)) files.push(full);
  }
  return files.sort();
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Optimize images of a rendered page: first one is the likely LCP, the rest are lazy. */
function optimizeImages(container: Element): void {
  const images = [...container.querySelectorAll("img")];
  images.forEach((image, index) => {
    if (index === 0) {
      if (!image.hasAttribute("fetchpriority")) image.setAttribute("fetchpriority", "high");
      return;
    }
    if (!image.hasAttribute("loading")) image.setAttribute("loading", "lazy");
    if (!image.hasAttribute("decoding")) image.setAttribute("decoding", "async");
  });
}

const RASTER = /\.(?:jpe?g|png)$/i;

function walkFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walkFiles(full));
    else files.push(full);
  }
  return files;
}

type Variants = Map<string, Array<"avif" | "webp">>;

/** Create AVIF/WebP siblings of every JPEG and PNG in the build output. Returns url -> formats. */
async function generateImageVariants(
  outDir: string,
  images: boolean | ImageOptions,
  warn: (message: string) => void,
): Promise<Variants> {
  const variants: Variants = new Map();
  const settings: ImageOptions = typeof images === "object" ? images : {};
  const formats = settings.formats ?? ["avif", "webp"];
  const quality = settings.quality ?? 70;

  let sharp: typeof import("sharp");
  try {
    sharp = (await import("sharp")).default;
  } catch {
    warn("jota static: `images` is on but the optional package `sharp` is not installed, so images were left as they are.");
    return variants;
  }

  for (const file of walkFiles(outDir)) {
    if (!RASTER.test(file)) continue;
    const url = `/${relative(outDir, file).replaceAll("\\", "/")}`;
    const made: Array<"avif" | "webp"> = [];
    for (const format of formats) {
      const target = file.replace(RASTER, `.${format}`);
      if (!existsSync(target)) {
        try {
          const pipeline = sharp(file);
          await (format === "avif" ? pipeline.avif({ quality }) : pipeline.webp({ quality })).toFile(target);
        } catch (error) {
          warn(`jota static: could not convert ${url} to ${format}: ${error instanceof Error ? error.message : String(error)}`);
          continue;
        }
      }
      made.push(format);
    }
    if (made.length > 0) variants.set(url, made);
  }
  return variants;
}

/** Wrap images that have converted variants in <picture>, best format first. */
function wrapInPicture(container: Element, variants: Variants): void {
  for (const image of [...container.querySelectorAll("img")]) {
    const src = image.getAttribute("src");
    const formats = src ? variants.get(src) : undefined;
    if (!src || !formats || image.parentElement?.tagName === "PICTURE") continue;
    const picture = document.createElement("picture");
    for (const format of ["avif", "webp"] as const) {
      if (!formats.includes(format)) continue;
      const source = document.createElement("source");
      source.setAttribute("type", `image/${format}`);
      source.setAttribute("srcset", src.replace(RASTER, `.${format}`));
      picture.appendChild(source);
    }
    image.replaceWith(picture);
    picture.appendChild(image);
  }
}

const GLOBAL_NAMES = [
  "window", "document", "Node", "DocumentFragment", "Element", "HTMLElement", "Text", "Event", "MouseEvent",
  "navigator", "location", "history", "CustomEvent", "MutationObserver", "getComputedStyle", "requestAnimationFrame",
] as const;

/** Install a DOM on globalThis while rendering. Returns a function that restores the previous state. */
function installDom(): { window: Window; restore: () => void } {
  const window = new Window({ url: "http://localhost/" });
  const previous = new Map<string, PropertyDescriptor | undefined>();
  const target = globalThis as unknown as Record<string, unknown>;

  for (const name of GLOBAL_NAMES) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    const value = name === "window" ? window : (window as unknown as Record<string, unknown>)[name];
    if (value === undefined) continue;
    Object.defineProperty(target, name, {
      value: typeof value === "function" && !/^[A-Z]/.test(name) ? (value as () => unknown).bind(window) : value,
      configurable: true,
      writable: true,
    });
  }
  return {
    window,
    restore: () => {
      for (const [name, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
        else delete target[name];
      }
      void window.happyDOM.close();
    },
  };
}

function applyHead(html: string, head: Head): string {
  let result = html;
  if (head.lang) result = result.replace(/<html([^>]*?)\blang="[^"]*"/, `<html$1lang="${escapeHtml(head.lang)}"`);
  if (head.title) {
    const title = `<title>${escapeHtml(head.title)}</title>`;
    result = /<title>[\s\S]*?<\/title>/.test(result)
      ? result.replace(/<title>[\s\S]*?<\/title>/, title)
      : result.replace("</head>", `  ${title}\n  </head>`);
  }
  if (head.description) {
    const meta = `<meta name="description" content="${escapeHtml(head.description)}" />`;
    result = /<meta\s+name="description"[^>]*>/.test(result)
      ? result.replace(/<meta\s+name="description"[^>]*>/, meta)
      : result.replace("</head>", `  ${meta}\n  </head>`);
  }
  return result;
}

function stripScripts(html: string): string {
  return html
    .replace(/<script\b[^>]*\btype="module"[^>]*>\s*<\/script>\s*/g, "")
    .replace(/<link\b[^>]*\brel="modulepreload"[^>]*>\s*/g, "");
}

async function inlineStyles(
  html: string,
  outDir: string,
  limit: number,
  critical: boolean,
  base: string,
): Promise<string> {
  const links = [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/g)];
  const sheets: Array<{ tag: string; css: string }> = [];
  for (const [tag] of links) {
    const href = /href="([^"]+)"/.exec(tag)?.[1];
    if (!href || /^https?:\/\//.test(href)) return html; // external stylesheet: leave everything as is
    const file = join(outDir, href.replace(/^\//, "").split("?")[0] as string);
    if (!existsSync(file)) return html;
    sheets.push({ tag, css: await readFile(file, "utf8") });
  }
  const total = sheets.reduce((sum, sheet) => sum + Buffer.byteLength(sheet.css), 0);
  if (sheets.length === 0) return html;
  if (total > limit) {
    if (!critical) return html;
    const { default: Beasties } = await import("beasties");
    const beasties = new Beasties({ path: outDir, publicPath: base, preload: "media", logLevel: "silent" });
    return (await beasties.process(html)).replace(" data-beasties-container", "");
  }
  let result = html;
  for (const sheet of sheets) result = result.replace(sheet.tag, () => `<style>${sheet.css.trim()}</style>`);
  return result;
}

export interface StaticBuildResult {
  pages: string[];
}

/** Render all routes. Exposed for tests and custom build scripts. */
export async function prerender(config: ResolvedConfig, options: StaticOptions = {}): Promise<StaticBuildResult> {
  const { createServer } = await import("vite");
  const root = config.root;
  const outDir = resolve(root, config.build.outDir);
  const shellPath = join(outDir, "index.html");
  if (!existsSync(shellPath)) throw new Error(`jota static: ${shellPath} not found. Run it after the client build.`);
  const shell = readFileSync(shellPath, "utf8");
  if (!/<div id="app">\s*<\/div>/.test(shell)) {
    throw new Error('jota static: index.html needs an empty <div id="app"></div> where pages are rendered.');
  }

  const routesDir = resolve(root, options.routesDir ?? "src/routes");
  const routeRoot = `/${relative(root, routesDir).replaceAll("\\", "/")}`;
  const limit = options.inlineCssLimit ?? 20_000;

  const server = await createServer({
    root,
    configFile: false,
    logLevel: "silent",
    appType: "custom",
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    resolve: { alias: config.resolve.alias },
    plugins: [
      {
        name: "jota-static-compiler",
        enforce: "pre",
        transform: (code, id) => transformJota(code, id, options.jota),
      },
    ],
  });

  const variants: Variants = options.images
    ? await generateImageVariants(outDir, options.images, (message) => config.logger.warn(message))
    : new Map();

  const dom = installDom();
  const rendered: string[] = [];
  try {
    const router = (await server.ssrLoadModule("jota-js")) as unknown as Router;
    const web = (await server.ssrLoadModule("jota-js/web")) as unknown as WebApi;

    const routes: RouteInfo[] = [];
    for (const file of walk(routesDir)) {
      const virtual = `/${relative(root, file).replaceAll("\\", "/")}`;
      const pattern = router.filePathToPattern(virtual, routeRoot);
      if (pattern !== null) routes.push({ pattern, file });
    }

    for (const route of routes) {
      const module = (await server.ssrLoadModule(route.file.replaceAll("\\", "/"))) as PageModule;
      const isDynamic = /[:*]/.test(route.pattern);
      let paramSets: Array<Record<string, string>> = [{}];
      if (isDynamic) {
        if (!module.paths) {
          config.logger.warn(`jota static: ${route.pattern} is dynamic and has no \`paths\` export, so it was not rendered.`);
          continue;
        }
        paramSets = await module.paths();
      }

      for (const params of paramSets) {
        const url = router.buildPath(route.pattern, params);
        const data = module.load ? await module.load({ params }) : undefined;
        const container = document.createElement("div");
        const dispose = web.mount(() => web.createComponent(module.default, { params, data }), container);
        optimizeImages(container);
        wrapInPicture(container, variants);
        const content = container.innerHTML;
        dispose();

        const head = typeof module.head === "function" ? module.head(params, data) : (module.head ?? {});
        let html = shell.replace(/<div id="app">\s*<\/div>/, () => `<div id="app">${content}</div>`);
        html = applyHead(html, head);
        // Static pages ship no script, unless they contain islands that need to be mounted.
        const hasIslands = content.includes("data-jota-island");
        if ((module.config?.render ?? "static") !== "client" && !hasIslands) html = stripScripts(html);
        html = await inlineStyles(html, outDir, limit, options.criticalCss !== false, config.base);

        const target = url === "/" ? shellPath : join(outDir, ...url.split("/").filter(Boolean), "index.html");
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, html, "utf8");
        if (url === "/404") await writeFile(join(outDir, "404.html"), html, "utf8");
        rendered.push(url);
      }
    }
  } finally {
    dom.restore();
    await server.close();
  }

  if (options.site) {
    const origin = options.site.replace(/\/+$/, "");
    const urls = rendered
      .filter((url) => url !== "/404")
      .map((url) => `  <url><loc>${escapeHtml(origin + (url === "/" ? "/" : `${url}/`))}</loc></url>`)
      .join("\n");
    await writeFile(
      join(outDir, "sitemap.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      "utf8",
    );
  }

  config.logger.info(`jota static: rendered ${rendered.length} page(s).`);
  return { pages: rendered };
}

/** Vite plugin: after the client build, render every route to static HTML. */
export default function jotaStatic(options: StaticOptions = {}): Plugin {
  let config: ResolvedConfig;
  return {
    name: "vite-plugin-jota-static",
    apply: "build",
    enforce: "post",
    configResolved(resolved) {
      config = resolved;
    },
    async closeBundle() {
      if (config.build.ssr) return;
      await prerender(config, options);
    },
  };
}
