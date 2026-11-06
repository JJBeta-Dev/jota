import type { JSXElement } from "jota-js";
import { Code, Layout } from "../../components/Layout";

export const head = {
  title: "Jota Guard | Jota",
  description: "Accessibility, semantics and performance checks for JSX and TSX, with configurable severity.",
  lang: "en",
};

const RULES: Array<[string, string, string]> = [
  ["jota/img-alt", "error", "<img> has alt (alt=\"\" for decorative images)"],
  ["jota/img-size", "warn", "<img> has width and height, which prevents layout shift"],
  ["jota/clickable-role", "error", "no onClick on non-interactive elements without a role, tabIndex and a key handler"],
  ["jota/button-name", "error", "buttons have an accessible name"],
  ["jota/link-name", "error", "links have an accessible name and a real href"],
  ["jota/input-label", "error", "inputs, selects and textareas are labelled"],
  ["jota/heading-order", "warn", "no skipped heading levels, a single h1"],
  ["jota/html-lang", "error", "<html> has lang"],
  ["jota/no-positive-tabindex", "warn", "no tabIndex greater than 0"],
  ["jota/media-captions", "warn", "<video> has a captions track"],
  ["jota/iframe-title", "error", "<iframe> has a title"],
  ["jota/aria-role-valid", "error", "role is a real ARIA role"],
  ["jota/aria-hidden-focusable", "error", "no aria-hidden on focusable elements"],
  ["jota/no-distracting-elements", "error", "no <marquee> or <blink>"],
  ["jota/valid-lang", "error", "lang looks like a language tag"],
  ["jota/no-autofocus", "warn", "no autoFocus"],
  ["jota/no-access-key", "warn", "no accessKey"],
  ["jota/no-redundant-alt", "warn", "no 'image' or 'photo' in alt"],
  ["jota/heading-has-content", "error", "headings are not empty"],
  ["jota/aria-props", "error", "aria-* attributes are real ARIA attributes"],
  ["jota/scope-valid", "error", "scope only on <th>"],
  ["jota/aria-unsupported-elements", "error", "no role/aria-* on <meta>, <html>, <script>, <style>..."],
  ["jota/mouse-events-have-key-events", "warn", "onMouseOver/onMouseOut come with onFocus/onBlur"],
  ["jota/no-redundant-roles", "warn", "no role the element already has"],
  ["jota/no-noninteractive-tabindex", "warn", "no tabIndex={0} on plain content"],
  ["jota/anchor-ambiguous-text", "warn", "no 'click here' or 'read more' link text"],
  ["jota/role-has-required-aria-props", "error", "a role comes with the aria-* it needs (checkbox needs aria-checked...)"],
  ["jota/autocomplete-valid", "error", "autoComplete uses a value from the HTML list"],
  ["jota/no-interactive-element-to-noninteractive-role", "error", "no role='presentation' on a button, link or input"],
  ["jota/aria-activedescendant-has-tabindex", "error", "aria-activedescendant on an element that can take focus"],
  ["jota/prefer-tag-over-role", "warn", "<div role='button'> can be a <button>"],
];

export default function Guard(): JSXElement {
  return (
    <Layout lang="en" path="/docs/guard">
      <h1>Jota Guard</h1>
      <p class="lead">
        Static checks for accessibility and semantics that work on any JSX or TSX project. They catch a known subset of
        problems; they cannot promise a page is fully accessible.
      </p>

      <Code code={`npx jota-guard src`} />
      <p>
        Exit codes: <code>0</code> nothing to fix, <code>1</code> problems found, <code>2</code> usage error.
      </p>

      <h2>Rules</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Rule</th>
            <th scope="col">Default</th>
            <th scope="col">Checks</th>
          </tr>
        </thead>
        <tbody>
          {RULES.map(([id, level, text]) => (
            <tr>
              <td>
                <code>{id}</code>
              </td>
              <td>{level}</td>
              <td>{text}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        When a rule cannot be sure (spread props, components, dynamic values) it stays silent instead of guessing.
      </p>

      <h2>Change the severity</h2>
      <p>Warnings are the default for <code>heading-order</code> and <code>img-size</code>. Make any rule an error, a warning or off:</p>
      <Code
        code={`npx jota-guard src --rule heading-order=error
npx jota-guard src --preset strict        # every warning becomes an error
npx jota-guard src --max-warnings 0       # fail on any warning`}
      />
      <p>Or use a <code>jota.config.json</code> file. Command line options win over the file, which wins over the preset.</p>
      <Code
        code={`{
  "guard": {
    "preset": "recommended",
    "rules": { "heading-order": "error", "img-size": "off" },
    "ignore": ["**/generated/**"],
    "maxWarnings": 10
  }
}`}
      />

      <h2>Use it with ESLint</h2>
      <Code
        code={`// eslint.config.js
import tsParser from "@typescript-eslint/parser";
import { configs } from "jota-guard";

export default [
  {
    files: ["**/*.{tsx,jsx}"],
    languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } } },
  },
  configs.recommended,
];`}
      />
    </Layout>
  );
}
