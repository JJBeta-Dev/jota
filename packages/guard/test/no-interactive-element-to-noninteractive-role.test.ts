import rule from "../src/rules/no-interactive-element-to-noninteractive-role.js";
import { tester } from "./tester.js";

tester.run("jota/no-interactive-element-to-noninteractive-role", rule, {
  valid: [
    { code: '<button role="tab">x</button>' },
    { code: '<button role="menuitem">x</button>' },
    { code: '<a href="/x" role="button">x</a>' },
    { code: '<a role="presentation">no href</a>' },
    { code: '<input type="hidden" role="none" />' },
    { code: '<div role="presentation" />' },
    { code: "<button role={role}>x</button>" },
    { code: '<Button role="presentation" />' },
  ],
  invalid: [
    {
      code: '<button role="presentation">x</button>',
      errors: [{ messageId: "wrongRole", data: { tag: "button", role: "presentation" } }],
    },
    { code: '<a href="/x" role="img">x</a>', errors: [{ messageId: "wrongRole" }] },
    { code: '<input role="none" />', errors: [{ messageId: "wrongRole" }] },
    { code: '<select role="group" />', errors: [{ messageId: "wrongRole" }] },
    { code: '<textarea role="article" />', errors: [{ messageId: "wrongRole" }] },
  ],
});
