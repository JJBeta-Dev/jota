import rule from "../src/rules/no-redundant-roles.js";
import { tester } from "./tester.js";

tester.run("jota/no-redundant-roles", rule, {
  valid: [
    { code: '<div role="button" />' },
    { code: '<ul role="menu" />' },
    { code: '<a role="button" href="/x" />' },
    { code: '<a role="link">no href</a>' },
    { code: "<button role={r} />" },
    { code: '<Nav role="navigation" />' },
  ],
  invalid: [
    {
      code: '<button role="button">x</button>',
      errors: [{ messageId: "redundantRole", data: { tag: "button", role: "button" } }],
    },
    { code: '<nav role="navigation" />', errors: [{ messageId: "redundantRole" }] },
    { code: '<a href="/x" role="link">x</a>', errors: [{ messageId: "redundantRole" }] },
    { code: '<ul role="list" />', errors: [{ messageId: "redundantRole" }] },
    { code: '<h2 role="heading">x</h2>', errors: [{ messageId: "redundantRole" }] },
  ],
});
