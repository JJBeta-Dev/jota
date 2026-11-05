// Type-only entry used by TypeScript when `jsxImportSource` is "jota-js" and `jsx` is "preserve".
// Jota's compiler removes all JSX at build time, so no runtime functions are needed here.
import type { JSXElement } from "./types.js";

export namespace JSX {
  export type Element = JSXElement;

  export interface ElementChildrenAttribute {
    children: unknown;
  }

  /**
   * Intrinsic elements are typed loosely for now: any tag with any props.
   * Stricter per-element types are planned (see PLAN.md).
   */
  export interface IntrinsicElements {
    [tag: string]: Record<string, unknown>;
  }
}

const unsupported = (): never => {
  throw new Error("Jota compiles JSX at build time. Use vite-plugin-jota instead of a runtime JSX factory.");
};

export const jsx = unsupported;
export const jsxs = unsupported;
export const jsxDEV = unsupported;
export const Fragment = unsupported;
