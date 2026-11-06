import rule from "../src/rules/aria-unsupported-elements.js";
import { tester } from "./tester.js";

tester.run("jota/aria-unsupported-elements", rule, {
  valid: [
    { code: '<html lang="en" />' },
    { code: '<meta charSet="utf-8" />' },
    { code: '<div role="button" aria-label="x" />' },
    { code: '<Script role="x" />' },
    { code: '<script src="/a.js" />' },
  ],
  invalid: [
    { code: '<meta aria-hidden="true" />', errors: [{ messageId: "unsupported", data: { tag: "meta", name: "aria-hidden" } }] },
    { code: '<html role="document" />', errors: [{ messageId: "unsupported" }] },
    { code: '<script aria-label="x" />', errors: [{ messageId: "unsupported" }] },
    { code: '<style role="none" />', errors: [{ messageId: "unsupported" }] },
    {
      code: '<title role="x" aria-hidden="true" />',
      errors: [{ messageId: "unsupported" }, { messageId: "unsupported" }],
    },
  ],
});
