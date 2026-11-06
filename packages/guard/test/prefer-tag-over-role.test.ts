import rule from "../src/rules/prefer-tag-over-role.js";
import { tester } from "./tester.js";

tester.run("jota/prefer-tag-over-role", rule, {
  valid: [
    { code: "<button>x</button>" },
    { code: '<div role="img" aria-label="Chart" />' },
    { code: '<div role="dialog" />' },
    { code: '<div role="tabpanel" />' },
    { code: '<div role={role} />' },
    { code: '<section role="button" />' },
    { code: '<div role="button" {...props} />' },
  ],
  invalid: [
    {
      code: '<div role="button" tabIndex={0} />',
      errors: [{ messageId: "preferTag", data: { tag: "div", role: "button", native: "<button>" } }],
    },
    { code: '<span role="link">x</span>', errors: [{ messageId: "preferTag" }] },
    { code: '<div role="navigation" />', errors: [{ messageId: "preferTag" }] },
    { code: '<div role="list"><div role="listitem" /></div>', errors: [{ messageId: "preferTag" }, { messageId: "preferTag" }] },
    { code: '<div role="checkbox" aria-checked="false" />', errors: [{ messageId: "preferTag" }] },
  ],
});
