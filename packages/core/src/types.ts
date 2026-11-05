/** Anything a component can return or place in JSX. */
export type JSXElement =
  | Node
  | string
  | number
  | boolean
  | null
  | undefined
  | JSXElement[]
  | (() => JSXElement);

/** Props that every component may receive. */
export interface ParentProps {
  children?: JSXElement;
}
