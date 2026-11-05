import { transformAsync } from "@babel/core";
import presetTypescript from "@babel/preset-typescript";
import jsxDomExpressions from "babel-plugin-jsx-dom-expressions";
import type { Plugin } from "vite";

export interface JotaOptions {
  /** Module that compiled code imports its DOM runtime from. Default: "jota-js/web". */
  moduleName?: string;
}

type BabelResult = NonNullable<Awaited<ReturnType<typeof transformAsync>>>;

export interface TransformResult {
  code: string;
  map: BabelResult["map"];
}

const JSX_FILE = /\.[jt]sx$/;

/**
 * Compile Jota JSX (and TypeScript) to plain JavaScript that updates the DOM directly.
 * Exposed separately from the Vite plugin so it can be tested and reused.
 */
export async function transformJota(
  code: string,
  id: string,
  options: JotaOptions = {},
): Promise<TransformResult | null> {
  const filename = id.split("?")[0] ?? id;
  if (!JSX_FILE.test(filename) || filename.includes("/node_modules/") || filename.includes("\node_modules\\")) {
    return null;
  }

  const result = await transformAsync(code, {
    filename,
    babelrc: false,
    configFile: false,
    sourceMaps: true,
    sourceFileName: filename,
    presets: filename.endsWith(".tsx") ? [[presetTypescript, { isTSX: true, allExtensions: true }]] : [],
    plugins: [
      [
        jsxDomExpressions,
        {
          moduleName: options.moduleName ?? "jota-js/web",
          generate: "dom",
          hydratable: false,
          delegateEvents: false,
          wrapConditionals: true,
          contextToCustomElements: false,
        },
      ],
    ],
  });

  if (!result?.code) return null;
  return { code: result.code, map: result.map ?? null };
}

/** Vite plugin: compiles `.jsx` and `.tsx` files with the Jota compiler. */
export default function jota(options: JotaOptions = {}): Plugin {
  return {
    name: "vite-plugin-jota",
    enforce: "pre",
    config() {
      return { resolve: { dedupe: ["jota-js"] } };
    },
    async transform(code, id) {
      return transformJota(code, id, options);
    },
  };
}
