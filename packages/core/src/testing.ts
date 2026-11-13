import type { JSXElement } from "./types.js";
import { mount } from "./web.js";

export interface RenderResult {
  /** The element the component was rendered into. It is attached to `document.body`. */
  container: HTMLElement;
  /** Dispose the component and remove the container. */
  unmount: () => void;
}

export interface AccessibilityViolation {
  /** The axe rule, for example "image-alt". */
  id: string;
  impact: string | null;
  help: string;
  helpUrl: string;
  /** The HTML of each element that fails the rule. */
  nodes: string[];
}

export interface AccessibilityOptions {
  /** Turn axe rules on or off by id: `{ "color-contrast": { enabled: true } }`. */
  rules?: Record<string, { enabled: boolean }>;
}

interface AxeResult {
  violations: Array<{ id: string; impact?: string | null; help: string; helpUrl: string; nodes: Array<{ html: string }> }>;
}

interface Axe {
  run: (context: Element, options: { rules: Record<string, { enabled: boolean }> }) => Promise<AxeResult>;
}

const mounted = new Set<() => void>();

/**
 * Render a component into a new element inside `document.body`, for tests.
 * `const { container } = render(() => <Counter />)`.
 */
export function render(code: () => JSXElement, options: { container?: HTMLElement } = {}): RenderResult {
  const container = options.container ?? document.body.appendChild(document.createElement("div"));
  const dispose = mount(code, container);
  const unmount = () => {
    if (!mounted.delete(unmount)) return;
    dispose();
    container.remove();
  };
  mounted.add(unmount);
  return { container, unmount };
}

/** Unmount everything `render` created. Call it in `afterEach`. */
export function cleanup(): void {
  for (const unmount of [...mounted]) unmount();
}

/**
 * Audit rendered DOM with axe-core (install it: `npm install -D axe-core`) and return what fails.
 * It complements Jota Guard: Guard reads the source, this reads the result, so it also sees content
 * that only exists at run time. Color contrast is off by default because test DOMs do not lay out
 * pages; turn it on in a real browser.
 */
export async function checkAccessibility(
  element: Element = document.body,
  options: AccessibilityOptions = {},
): Promise<AccessibilityViolation[]> {
  let axe: Axe;
  try {
    const module = (await import("axe-core")) as unknown as { default?: Axe } & Axe;
    axe = module.default ?? module;
  } catch (error) {
    throw new Error("Jota: checkAccessibility needs axe-core. Install it with `npm install -D axe-core`.", { cause: error });
  }
  const result = await axe.run(element, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false }, ...options.rules },
  });
  return result.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact ?? null,
    help: violation.help,
    helpUrl: violation.helpUrl,
    nodes: violation.nodes.map((node) => node.html),
  }));
}

/** Fail the test when the rendered DOM has accessibility problems, listing each one with its element. */
export async function expectAccessible(element?: Element, options?: AccessibilityOptions): Promise<void> {
  const violations = await checkAccessibility(element, options);
  if (violations.length === 0) return;
  const lines = violations.map(
    (violation) => `- ${violation.id} (${violation.impact ?? "unknown"}): ${violation.help}\n    ${violation.nodes.join("\n    ")}\n    ${violation.helpUrl}`,
  );
  throw new Error(`${violations.length} accessibility problem(s) found:\n${lines.join("\n")}`);
}
