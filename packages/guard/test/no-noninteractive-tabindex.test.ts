import rule from "../src/rules/no-noninteractive-tabindex.js";
import { tester } from "./tester.js";

tester.run("jota/no-noninteractive-tabindex", rule, {
  valid: [
    { code: "<button tabIndex={0}>x</button>" },
    { code: "<div tabIndex={-1} />" },
    { code: '<div role="tabpanel" tabIndex={0} />' },
    { code: "<div tabIndex={0} onKeyDown={k} />" },
    { code: "<div tabIndex={order} />" },
    { code: "<Box tabIndex={0} />" },
    { code: "<div tabIndex={0} {...props} />" },
  ],
  invalid: [
    { code: "<div tabIndex={0}>text</div>", errors: [{ messageId: "nonInteractive", data: { tag: "div", value: "{0}" } }] },
    { code: '<p tabIndex="0">text</p>', errors: [{ messageId: "nonInteractive" }] },
    { code: "<section tabIndex={1} />", errors: [{ messageId: "nonInteractive" }] },
    { code: "<span tabIndex={0} />", errors: [{ messageId: "nonInteractive" }] },
    { code: "<li tabIndex={0}>x</li>", errors: [{ messageId: "nonInteractive" }] },
  ],
});
