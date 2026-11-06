import rule from "../src/rules/aria-role-valid.js";
import { tester } from "./tester.js";

tester.run("jota/aria-role-valid", rule, {
  valid: [
    { code: '<div role="button" />' },
    { code: '<ul role="list" />' },
    { code: '<div role="doc-chapter" />' },
    { code: '<div role="foo button" />' },
    { code: "<div role={role} />" },
    { code: '<Box role="banana" />' },
  ],
  invalid: [
    { code: '<div role="buton" />', errors: [{ messageId: "invalidRole", data: { value: "buton" } }] },
    { code: '<div role="" />', errors: [{ messageId: "invalidRole" }] },
    { code: '<div role="Button" />', errors: [{ messageId: "invalidRole" }] },
    { code: '<span role="widget" />', errors: [{ messageId: "invalidRole" }] },
    { code: "<div role={`clickable`} />", errors: [{ messageId: "invalidRole" }] },
  ],
});
