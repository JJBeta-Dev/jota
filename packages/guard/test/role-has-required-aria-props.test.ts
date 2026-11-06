import rule from "../src/rules/role-has-required-aria-props.js";
import { tester } from "./tester.js";

tester.run("jota/role-has-required-aria-props", rule, {
  valid: [
    { code: '<div role="checkbox" aria-checked="true" />' },
    { code: '<div role="checkbox" aria-checked={on} />' },
    { code: '<input type="checkbox" role="checkbox" />' },
    { code: '<h2 role="heading">x</h2>' },
    { code: '<div role="button" />' },
    { code: '<div role="slider" aria-valuenow={3} />' },
    { code: '<div role={role} />' },
    { code: '<Box role="checkbox" />' },
  ],
  invalid: [
    {
      code: '<div role="checkbox" />',
      errors: [{ messageId: "missingProps", data: { role: "checkbox", props: "aria-checked" } }],
    },
    { code: '<span role="switch" />', errors: [{ messageId: "missingProps" }] },
    { code: '<div role="slider" aria-valuemin={0} />', errors: [{ messageId: "missingProps" }] },
    { code: '<div role="heading">Title</div>', errors: [{ messageId: "missingProps" }] },
    { code: '<li role="menuitemradio" />', errors: [{ messageId: "missingProps" }] },
  ],
});
