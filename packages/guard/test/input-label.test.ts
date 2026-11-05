import rule from "../src/rules/input-label.js";
import { tester } from "./tester.js";

tester.run("jota/input-label", rule, {
  valid: [
    { code: '<><label htmlFor="email">Email</label><input id="email" type="email" /></>' },
    { code: '<><input id="email" type="email" /><label htmlFor="email">Email</label></>' },
    { code: '<label>Email <input type="email" /></label>' },
    { code: '<input type="email" aria-label="Email" />' },
    { code: '<input type="search" aria-labelledby="search-title" />' },
    { code: '<input type="hidden" name="csrf" />' },
    { code: '<input type="submit" value="Send" />' },
    { code: "<input {...props} />" },
    { code: '<><label htmlFor={id}>Name</label><input id="anything" /></>' },
    { code: "<input id={id} />" },
    { code: '<label><span>Pick</span><select><option>a</option></select></label>' },
  ],
  invalid: [
    { code: '<input type="email" />', errors: [{ messageId: "missingLabel", data: { tag: "input" } }] },
    { code: "<textarea />", errors: [{ messageId: "missingLabel", data: { tag: "textarea" } }] },
    { code: "<select><option>a</option></select>", errors: [{ messageId: "missingLabel" }] },
    {
      code: '<><label htmlFor="other">Other</label><input id="email" /></>',
      errors: [{ messageId: "missingLabel" }],
    },
    { code: '<input id="email" />', errors: [{ messageId: "missingLabel" }] },
    {
      code: '<form><input type="text" name="q" /></form>',
      errors: [{ messageId: "missingLabel" }],
    },
  ],
});
