// Type-only entry used by TypeScript when `jsxImportSource` is "jota-js" and `jsx` is "preserve".
// Jota's compiler removes all JSX at build time, so no runtime functions are needed here.
import type { CustomElements, IntrinsicElementMap } from "./jsx-types.js";
import type { JSXElement } from "./types.js";

export type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  CSSProperties,
  EventHandler,
  FormHTMLAttributes,
  HTMLAttributes,
  ImgHTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SVGAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "./jsx-types.js";

export namespace JSX {
  export type Element = JSXElement;

  export interface ElementChildrenAttribute {
    children: unknown;
  }

  /** Attributes accepted by every element and component. */
  export interface IntrinsicAttributes {
    key?: string | number | undefined;
  }

  export interface IntrinsicElements extends IntrinsicElementMap, CustomElements {}
}

const unsupported = (): never => {
  throw new Error("Jota compiles JSX at build time. Use vite-plugin-jota instead of a runtime JSX factory.");
};

export const jsx = unsupported;
export const jsxs = unsupported;
export const jsxDEV = unsupported;
export const Fragment = unsupported;
