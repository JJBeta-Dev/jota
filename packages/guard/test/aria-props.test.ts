import rule from "../src/rules/aria-props.js";
import { tester } from "./tester.js";

tester.run("jota/aria-props", rule, {
  valid: [
    { code: '<div aria-label="x" />' },
    { code: '<button aria-expanded="true" aria-controls="m" />' },
    { code: '<div aria-labelledby="a" aria-describedby="b" />' },
    { code: '<Box aria-foo="x" />' },
    { code: '<input data-aria-foo="x" />' },
  ],
  invalid: [
    { code: '<div aria-lable="x" />', errors: [{ messageId: "invalidAria", data: { name: "aria-lable" } }] },
    { code: '<button aria-pressd="true" />', errors: [{ messageId: "invalidAria" }] },
    { code: '<div aria-role="button" />', errors: [{ messageId: "invalidAria" }] },
    { code: '<div aria-hiden="true" />', errors: [{ messageId: "invalidAria" }] },
    {
      code: '<div aria-foo="x" aria-bar="y" />',
      errors: [{ messageId: "invalidAria" }, { messageId: "invalidAria" }],
    },
  ],
});
