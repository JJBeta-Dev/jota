import rule from "../src/rules/scope-valid.js";
import { tester } from "./tester.js";

tester.run("jota/scope-valid", rule, {
  valid: [
    { code: '<th scope="col">Name</th>' },
    { code: '<th scope="row">Row</th>' },
    { code: "<td>cell</td>" },
    { code: '<Cell scope="col" />' },
    { code: '<th scope={s} />' },
  ],
  invalid: [
    { code: '<td scope="col">x</td>', errors: [{ messageId: "invalidScope", data: { tag: "td" } }] },
    { code: '<div scope="row" />', errors: [{ messageId: "invalidScope" }] },
    { code: '<tr scope="row" />', errors: [{ messageId: "invalidScope" }] },
    { code: "<span scope={s} />", errors: [{ messageId: "invalidScope" }] },
    { code: '<table scope="col" />', errors: [{ messageId: "invalidScope" }] },
  ],
});
