import rule from "../src/rules/aria-hidden-focusable.js";
import { tester } from "./tester.js";

tester.run("jota/aria-hidden-focusable", rule, {
  valid: [
    { code: '<svg aria-hidden="true" />' },
    { code: '<div aria-hidden="true">decor</div>' },
    { code: '<button aria-hidden="true" tabIndex={-1}>x</button>' },
    { code: "<button>Save</button>" },
    { code: '<a aria-hidden="true">no href</a>' },
    { code: '<input type="hidden" aria-hidden="true" />' },
    { code: '<Button aria-hidden="true" />' },
  ],
  invalid: [
    { code: '<button aria-hidden="true">x</button>', errors: [{ messageId: "hiddenFocusable" }] },
    { code: '<a href="/x" aria-hidden="true">x</a>', errors: [{ messageId: "hiddenFocusable" }] },
    { code: "<input aria-hidden />", errors: [{ messageId: "hiddenFocusable" }] },
    { code: '<div aria-hidden="true" tabIndex={0}>x</div>', errors: [{ messageId: "hiddenFocusable" }] },
    { code: "<select aria-hidden={true} />", errors: [{ messageId: "hiddenFocusable" }] },
  ],
});
