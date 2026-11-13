/**
 * Types for JSX intrinsic elements.
 *
 * Attributes use HTML names (`class`, `for`) and also accept the React-style aliases that Jota's
 * compiler understands (`className`, `htmlFor`). Any `data-*` and `aria-*` attribute is allowed.
 * Event handlers are written `onClick`, `onInput`, ... and receive the event with a typed
 * `currentTarget`. With `exactOptionalPropertyTypes`, optional props also accept `undefined`.
 */
import type { JSXElement } from "./types.js";

type Opt<T> = T | undefined;
type Booleanish = boolean | "true" | "false";

export type EventHandler<T, E extends Event> = (event: E & { currentTarget: T; target: Element }) => void;

export interface CSSProperties {
  [property: string]: string | number | undefined;
}

export interface DOMEvents<T> {
  onClick?: Opt<EventHandler<T, MouseEvent>>;
  onDblClick?: Opt<EventHandler<T, MouseEvent>>;
  onContextMenu?: Opt<EventHandler<T, MouseEvent>>;
  onMouseDown?: Opt<EventHandler<T, MouseEvent>>;
  onMouseUp?: Opt<EventHandler<T, MouseEvent>>;
  onMouseEnter?: Opt<EventHandler<T, MouseEvent>>;
  onMouseLeave?: Opt<EventHandler<T, MouseEvent>>;
  onMouseMove?: Opt<EventHandler<T, MouseEvent>>;
  onMouseOver?: Opt<EventHandler<T, MouseEvent>>;
  onMouseOut?: Opt<EventHandler<T, MouseEvent>>;
  onPointerDown?: Opt<EventHandler<T, PointerEvent>>;
  onPointerUp?: Opt<EventHandler<T, PointerEvent>>;
  onPointerMove?: Opt<EventHandler<T, PointerEvent>>;
  onPointerEnter?: Opt<EventHandler<T, PointerEvent>>;
  onPointerLeave?: Opt<EventHandler<T, PointerEvent>>;
  onPointerCancel?: Opt<EventHandler<T, PointerEvent>>;
  onTouchStart?: Opt<EventHandler<T, TouchEvent>>;
  onTouchEnd?: Opt<EventHandler<T, TouchEvent>>;
  onTouchMove?: Opt<EventHandler<T, TouchEvent>>;
  onKeyDown?: Opt<EventHandler<T, KeyboardEvent>>;
  onKeyUp?: Opt<EventHandler<T, KeyboardEvent>>;
  onKeyPress?: Opt<EventHandler<T, KeyboardEvent>>;
  onFocus?: Opt<EventHandler<T, FocusEvent>>;
  onBlur?: Opt<EventHandler<T, FocusEvent>>;
  onFocusIn?: Opt<EventHandler<T, FocusEvent>>;
  onFocusOut?: Opt<EventHandler<T, FocusEvent>>;
  onInput?: Opt<EventHandler<T, InputEvent>>;
  onChange?: Opt<EventHandler<T, Event>>;
  onSubmit?: Opt<EventHandler<T, SubmitEvent>>;
  onReset?: Opt<EventHandler<T, Event>>;
  onInvalid?: Opt<EventHandler<T, Event>>;
  onScroll?: Opt<EventHandler<T, Event>>;
  onWheel?: Opt<EventHandler<T, WheelEvent>>;
  onDragStart?: Opt<EventHandler<T, DragEvent>>;
  onDragOver?: Opt<EventHandler<T, DragEvent>>;
  onDrop?: Opt<EventHandler<T, DragEvent>>;
  onLoad?: Opt<EventHandler<T, Event>>;
  onError?: Opt<EventHandler<T, Event>>;
  onAnimationEnd?: Opt<EventHandler<T, AnimationEvent>>;
  onTransitionEnd?: Opt<EventHandler<T, TransitionEvent>>;
}

export interface HTMLAttributes<T> extends DOMEvents<T> {
  children?: Opt<JSXElement>;
  /** Sets the HTML of the element. Only for trusted HTML (for example compiled Markdown): it is not escaped. */
  innerHTML?: Opt<string>;
  textContent?: Opt<string>;
  /** Called with the element once it exists, or receives it: `let el; <div ref={el} />`. */
  ref?: Opt<T | ((element: T) => void)>;
  id?: Opt<string>;
  class?: Opt<string>;
  className?: Opt<string>;
  classList?: Opt<Record<string, boolean | undefined>>;
  style?: Opt<string | CSSProperties>;
  title?: Opt<string>;
  lang?: Opt<string>;
  dir?: Opt<"ltr" | "rtl" | "auto">;
  hidden?: Opt<boolean | "hidden" | "until-found">;
  tabIndex?: Opt<number>;
  role?: Opt<string>;
  slot?: Opt<string>;
  draggable?: Opt<Booleanish>;
  contentEditable?: Opt<Booleanish | "plaintext-only">;
  spellcheck?: Opt<Booleanish>;
  translate?: Opt<"yes" | "no">;
  inert?: Opt<boolean>;
  popover?: Opt<"auto" | "manual" | "">;
  autofocus?: Opt<boolean>;
  accesskey?: Opt<string>;
  inputMode?: Opt<"none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search">;
  [attribute: `data-${string}`]: Opt<string | number | boolean>;
  [attribute: `aria-${string}`]: Opt<string | number | boolean>;
}

type Referrer = "" | "no-referrer" | "no-referrer-when-downgrade" | "origin" | "origin-when-cross-origin" | "same-origin" | "strict-origin" | "strict-origin-when-cross-origin" | "unsafe-url";

export interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> {
  href?: Opt<string>;
  target?: Opt<"_self" | "_blank" | "_parent" | "_top" | (string & {})>;
  rel?: Opt<string>;
  download?: Opt<string | boolean>;
  hreflang?: Opt<string>;
  type?: Opt<string>;
  referrerpolicy?: Opt<Referrer>;
  ping?: Opt<string>;
}

export interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
  type?: Opt<"button" | "submit" | "reset">;
  disabled?: Opt<boolean>;
  name?: Opt<string>;
  value?: Opt<string | number>;
  form?: Opt<string>;
  formAction?: Opt<string>;
  formMethod?: Opt<string>;
  formNoValidate?: Opt<boolean>;
  formTarget?: Opt<string>;
  popovertarget?: Opt<string>;
}

export interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
  type?: Opt<
    | "button" | "checkbox" | "color" | "date" | "datetime-local" | "email" | "file" | "hidden" | "image" | "month"
    | "number" | "password" | "radio" | "range" | "reset" | "search" | "submit" | "tel" | "text" | "time" | "url" | "week"
  >;
  value?: Opt<string | number | readonly string[]>;
  checked?: Opt<boolean>;
  disabled?: Opt<boolean>;
  readOnly?: Opt<boolean>;
  required?: Opt<boolean>;
  multiple?: Opt<boolean>;
  name?: Opt<string>;
  placeholder?: Opt<string>;
  autocomplete?: Opt<string>;
  min?: Opt<string | number>;
  max?: Opt<string | number>;
  step?: Opt<string | number>;
  minLength?: Opt<number>;
  maxLength?: Opt<number>;
  pattern?: Opt<string>;
  accept?: Opt<string>;
  list?: Opt<string>;
  size?: Opt<number>;
  form?: Opt<string>;
  alt?: Opt<string>;
  src?: Opt<string>;
  width?: Opt<number | string>;
  height?: Opt<number | string>;
  indeterminate?: Opt<boolean>;
}

export interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
  value?: Opt<string>;
  disabled?: Opt<boolean>;
  readOnly?: Opt<boolean>;
  required?: Opt<boolean>;
  name?: Opt<string>;
  placeholder?: Opt<string>;
  rows?: Opt<number>;
  cols?: Opt<number>;
  minLength?: Opt<number>;
  maxLength?: Opt<number>;
  wrap?: Opt<"hard" | "soft" | "off">;
  autocomplete?: Opt<string>;
  form?: Opt<string>;
}

export interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
  value?: Opt<string | number>;
  disabled?: Opt<boolean>;
  required?: Opt<boolean>;
  multiple?: Opt<boolean>;
  name?: Opt<string>;
  size?: Opt<number>;
  autocomplete?: Opt<string>;
  form?: Opt<string>;
}

export interface OptionHTMLAttributes<T> extends HTMLAttributes<T> {
  value?: Opt<string | number>;
  selected?: Opt<boolean>;
  disabled?: Opt<boolean>;
  label?: Opt<string>;
}

export interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
  action?: Opt<string>;
  method?: Opt<"get" | "post" | "dialog">;
  noValidate?: Opt<boolean>;
  target?: Opt<string>;
  enctype?: Opt<string>;
  autocomplete?: Opt<string>;
  name?: Opt<string>;
}

export interface LabelHTMLAttributes<T> extends HTMLAttributes<T> {
  htmlFor?: Opt<string>;
  for?: Opt<string>;
  form?: Opt<string>;
}

export interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
  src?: Opt<string>;
  alt?: Opt<string>;
  width?: Opt<number | string>;
  height?: Opt<number | string>;
  loading?: Opt<"eager" | "lazy">;
  decoding?: Opt<"async" | "sync" | "auto">;
  fetchpriority?: Opt<"high" | "low" | "auto">;
  srcset?: Opt<string>;
  sizes?: Opt<string>;
  crossorigin?: Opt<"anonymous" | "use-credentials" | "">;
  referrerpolicy?: Opt<Referrer>;
  usemap?: Opt<string>;
}

export interface MediaHTMLAttributes<T> extends HTMLAttributes<T> {
  src?: Opt<string>;
  controls?: Opt<boolean>;
  autoplay?: Opt<boolean>;
  loop?: Opt<boolean>;
  muted?: Opt<boolean>;
  preload?: Opt<"none" | "metadata" | "auto" | "">;
  crossorigin?: Opt<"anonymous" | "use-credentials" | "">;
  playsinline?: Opt<boolean>;
  poster?: Opt<string>;
  width?: Opt<number | string>;
  height?: Opt<number | string>;
}

export interface SourceHTMLAttributes<T> extends HTMLAttributes<T> {
  src?: Opt<string>;
  srcset?: Opt<string>;
  type?: Opt<string>;
  media?: Opt<string>;
  sizes?: Opt<string>;
  width?: Opt<number | string>;
  height?: Opt<number | string>;
}

export interface TrackHTMLAttributes<T> extends HTMLAttributes<T> {
  kind?: Opt<"subtitles" | "captions" | "descriptions" | "chapters" | "metadata">;
  src?: Opt<string>;
  srclang?: Opt<string>;
  srcLang?: Opt<string>;
  label?: Opt<string>;
  default?: Opt<boolean>;
}

export interface TableCellHTMLAttributes<T> extends HTMLAttributes<T> {
  colSpan?: Opt<number>;
  rowSpan?: Opt<number>;
  headers?: Opt<string>;
  scope?: Opt<"row" | "col" | "rowgroup" | "colgroup">;
  abbr?: Opt<string>;
}

export interface IframeHTMLAttributes<T> extends HTMLAttributes<T> {
  src?: Opt<string>;
  srcdoc?: Opt<string>;
  name?: Opt<string>;
  width?: Opt<number | string>;
  height?: Opt<number | string>;
  loading?: Opt<"eager" | "lazy">;
  allow?: Opt<string>;
  allowfullscreen?: Opt<boolean>;
  sandbox?: Opt<string>;
  referrerpolicy?: Opt<Referrer>;
}

export interface DetailsHTMLAttributes<T> extends HTMLAttributes<T> {
  open?: Opt<boolean>;
  name?: Opt<string>;
}

export interface ProgressHTMLAttributes<T> extends HTMLAttributes<T> {
  value?: Opt<number | string>;
  max?: Opt<number | string>;
  min?: Opt<number | string>;
  low?: Opt<number | string>;
  high?: Opt<number | string>;
  optimum?: Opt<number | string>;
}

export interface TimeHTMLAttributes<T> extends HTMLAttributes<T> {
  datetime?: Opt<string>;
}

export interface OlHTMLAttributes<T> extends HTMLAttributes<T> {
  start?: Opt<number>;
  reversed?: Opt<boolean>;
  type?: Opt<"1" | "a" | "A" | "i" | "I">;
}

export interface MetaHTMLAttributes<T> extends HTMLAttributes<T> {
  name?: Opt<string>;
  content?: Opt<string>;
  charset?: Opt<string>;
  property?: Opt<string>;
  "http-equiv"?: Opt<string>;
}

export interface LinkHTMLAttributes<T> extends HTMLAttributes<T> {
  rel?: Opt<string>;
  href?: Opt<string>;
  type?: Opt<string>;
  media?: Opt<string>;
  as?: Opt<string>;
  crossorigin?: Opt<"anonymous" | "use-credentials" | "">;
  hreflang?: Opt<string>;
  sizes?: Opt<string>;
}

type SvgValue = Opt<string | number | boolean>;

/** Common SVG presentation and geometry attributes. SVG is typed loosely on purpose. */
export interface SVGAttributes<T> extends HTMLAttributes<T> {
  viewBox?: SvgValue;
  width?: SvgValue;
  height?: SvgValue;
  x?: SvgValue;
  y?: SvgValue;
  x1?: SvgValue;
  x2?: SvgValue;
  y1?: SvgValue;
  y2?: SvgValue;
  cx?: SvgValue;
  cy?: SvgValue;
  r?: SvgValue;
  rx?: SvgValue;
  ry?: SvgValue;
  d?: SvgValue;
  points?: SvgValue;
  fill?: SvgValue;
  "fill-opacity"?: SvgValue;
  "fill-rule"?: SvgValue;
  stroke?: SvgValue;
  "stroke-width"?: SvgValue;
  "stroke-linecap"?: SvgValue;
  "stroke-linejoin"?: SvgValue;
  "stroke-dasharray"?: SvgValue;
  "stroke-opacity"?: SvgValue;
  opacity?: SvgValue;
  transform?: SvgValue;
  xmlns?: SvgValue;
  preserveAspectRatio?: SvgValue;
  offset?: SvgValue;
  "stop-color"?: SvgValue;
  "stop-opacity"?: SvgValue;
  gradientUnits?: SvgValue;
  gradientTransform?: SvgValue;
  href?: SvgValue;
  clipPath?: SvgValue;
  "clip-path"?: SvgValue;
  "text-anchor"?: SvgValue;
  "dominant-baseline"?: SvgValue;
  "font-size"?: SvgValue;
  "font-weight"?: SvgValue;
  "font-family"?: SvgValue;
  filter?: SvgValue;
  mask?: SvgValue;
  focusable?: SvgValue;
}

type Same<T> = HTMLAttributes<T>;

/** Typed attributes for every standard HTML and common SVG element. */
export interface IntrinsicElementMap {
  /** text and sections */
  a: AnchorHTMLAttributes<HTMLAnchorElement>;
  abbr: Same<HTMLElement>; address: Same<HTMLElement>; article: Same<HTMLElement>; aside: Same<HTMLElement>;
  b: Same<HTMLElement>; bdi: Same<HTMLElement>; bdo: Same<HTMLElement>; blockquote: Same<HTMLQuoteElement>;
  body: Same<HTMLBodyElement>; br: Same<HTMLBRElement>; caption: Same<HTMLTableCaptionElement>; cite: Same<HTMLElement>;
  code: Same<HTMLElement>; dd: Same<HTMLElement>; del: Same<HTMLModElement>; dfn: Same<HTMLElement>;
  div: Same<HTMLDivElement>; dl: Same<HTMLDListElement>; dt: Same<HTMLElement>; em: Same<HTMLElement>;
  fieldset: Same<HTMLFieldSetElement>; figcaption: Same<HTMLElement>; figure: Same<HTMLElement>; footer: Same<HTMLElement>;
  h1: Same<HTMLHeadingElement>; h2: Same<HTMLHeadingElement>; h3: Same<HTMLHeadingElement>; h4: Same<HTMLHeadingElement>;
  h5: Same<HTMLHeadingElement>; h6: Same<HTMLHeadingElement>; head: Same<HTMLHeadElement>; header: Same<HTMLElement>;
  hgroup: Same<HTMLElement>; hr: Same<HTMLHRElement>; html: Same<HTMLHtmlElement>; i: Same<HTMLElement>;
  ins: Same<HTMLModElement>; kbd: Same<HTMLElement>; legend: Same<HTMLLegendElement>; li: Same<HTMLLIElement>;
  main: Same<HTMLElement>; mark: Same<HTMLElement>; menu: Same<HTMLMenuElement>; nav: Same<HTMLElement>;
  noscript: Same<HTMLElement>; p: Same<HTMLParagraphElement>; picture: Same<HTMLPictureElement>; pre: Same<HTMLPreElement>;
  q: Same<HTMLQuoteElement>; rp: Same<HTMLElement>; rt: Same<HTMLElement>; ruby: Same<HTMLElement>; s: Same<HTMLElement>;
  samp: Same<HTMLElement>; search: Same<HTMLElement>; section: Same<HTMLElement>; small: Same<HTMLElement>;
  span: Same<HTMLSpanElement>; strong: Same<HTMLElement>; style: Same<HTMLStyleElement>; sub: Same<HTMLElement>;
  summary: Same<HTMLElement>; sup: Same<HTMLElement>; template: Same<HTMLTemplateElement>; title: Same<HTMLTitleElement>;
  u: Same<HTMLElement>; ul: Same<HTMLUListElement>; var: Same<HTMLElement>; wbr: Same<HTMLElement>;
  /** elements with their own attributes */
  button: ButtonHTMLAttributes<HTMLButtonElement>;
  input: InputHTMLAttributes<HTMLInputElement>;
  textarea: TextareaHTMLAttributes<HTMLTextAreaElement>;
  select: SelectHTMLAttributes<HTMLSelectElement>;
  option: OptionHTMLAttributes<HTMLOptionElement>;
  optgroup: HTMLAttributes<HTMLOptGroupElement> & { label?: Opt<string>; disabled?: Opt<boolean> };
  datalist: Same<HTMLDataListElement>;
  form: FormHTMLAttributes<HTMLFormElement>;
  label: LabelHTMLAttributes<HTMLLabelElement>;
  output: LabelHTMLAttributes<HTMLOutputElement> & { name?: Opt<string> };
  img: ImgHTMLAttributes<HTMLImageElement>;
  video: MediaHTMLAttributes<HTMLVideoElement>;
  audio: MediaHTMLAttributes<HTMLAudioElement>;
  source: SourceHTMLAttributes<HTMLSourceElement>;
  track: TrackHTMLAttributes<HTMLTrackElement>;
  iframe: IframeHTMLAttributes<HTMLIFrameElement>;
  canvas: HTMLAttributes<HTMLCanvasElement> & { width?: Opt<number | string>; height?: Opt<number | string> };
  details: DetailsHTMLAttributes<HTMLDetailsElement>;
  dialog: HTMLAttributes<HTMLDialogElement> & { open?: Opt<boolean> };
  progress: ProgressHTMLAttributes<HTMLProgressElement>;
  meter: ProgressHTMLAttributes<HTMLMeterElement>;
  time: TimeHTMLAttributes<HTMLTimeElement>;
  data: HTMLAttributes<HTMLDataElement> & { value?: Opt<string> };
  ol: OlHTMLAttributes<HTMLOListElement>;
  table: Same<HTMLTableElement>;
  thead: Same<HTMLTableSectionElement>; tbody: Same<HTMLTableSectionElement>; tfoot: Same<HTMLTableSectionElement>;
  tr: Same<HTMLTableRowElement>;
  td: TableCellHTMLAttributes<HTMLTableCellElement>;
  th: TableCellHTMLAttributes<HTMLTableCellElement>;
  col: HTMLAttributes<HTMLTableColElement> & { span?: Opt<number> };
  colgroup: HTMLAttributes<HTMLTableColElement> & { span?: Opt<number> };
  meta: MetaHTMLAttributes<HTMLMetaElement>;
  link: LinkHTMLAttributes<HTMLLinkElement>;
  base: HTMLAttributes<HTMLBaseElement> & { href?: Opt<string>; target?: Opt<string> };
  script: HTMLAttributes<HTMLScriptElement> & { src?: Opt<string>; type?: Opt<string>; async?: Opt<boolean>; defer?: Opt<boolean> };
  slot: HTMLAttributes<HTMLSlotElement> & { name?: Opt<string> };
  /** SVG */
  svg: SVGAttributes<SVGSVGElement>;
  g: SVGAttributes<SVGGElement>;
  path: SVGAttributes<SVGPathElement>;
  circle: SVGAttributes<SVGCircleElement>;
  ellipse: SVGAttributes<SVGEllipseElement>;
  rect: SVGAttributes<SVGRectElement>;
  line: SVGAttributes<SVGLineElement>;
  polyline: SVGAttributes<SVGPolylineElement>;
  polygon: SVGAttributes<SVGPolygonElement>;
  text: SVGAttributes<SVGTextElement>;
  tspan: SVGAttributes<SVGTSpanElement>;
  defs: SVGAttributes<SVGDefsElement>;
  use: SVGAttributes<SVGUseElement>;
  linearGradient: SVGAttributes<SVGLinearGradientElement>;
  radialGradient: SVGAttributes<SVGRadialGradientElement>;
  stop: SVGAttributes<SVGStopElement>;
  clipPath: SVGAttributes<SVGClipPathElement>;
  mask: SVGAttributes<SVGMaskElement>;
  symbol: SVGAttributes<SVGSymbolElement>;
  filter: SVGAttributes<SVGFilterElement>;
}

/** Custom elements (names with a hyphen) accept any attributes. */
export type CustomElements = {
  [tag: `${string}-${string}`]: HTMLAttributes<HTMLElement> & { [attribute: string]: unknown };
};
