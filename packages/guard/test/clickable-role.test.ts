import rule from "../src/rules/clickable-role.js";
import { tester } from "./tester.js";

tester.run("jota/clickable-role", rule, {
  valid: [
    { code: '<button type="button" onClick={go}>Go</button>' },
    { code: '<a href="/x" onClick={track}>Go</a>' },
    { code: "<div>Plain text</div>" },
    { code: "<div {...props} onClick={go} />" },
    {
      code: '<div role="button" tabIndex={0} onClick={go} onKeyDown={key}>Go</div>',
    },
    { code: '<div role="presentation" onClick={close} />' },
    { code: "<div role={role} onClick={go} />" },
    { code: "<Card onClick={go} />" },
  ],
  invalid: [
    {
      code: "<div onClick={openMenu}>Open</div>",
      errors: [{ messageId: "notKeyboardAccessible", data: { tag: "div" } }],
    },
    {
      code: "<span onClick={openMenu}>Open</span>",
      errors: [{ messageId: "notKeyboardAccessible", data: { tag: "span" } }],
    },
    {
      code: "<li onClick={pick}>Item</li>",
      errors: [{ messageId: "notKeyboardAccessible" }],
    },
    {
      code: '<div role="button" onClick={go}>Go</div>',
      errors: [{ messageId: "incompleteRole", data: { tag: "div", role: "button" } }],
    },
    {
      code: '<div role="button" tabIndex={0} onClick={go}>Go</div>',
      errors: [{ messageId: "incompleteRole" }],
    },
    {
      code: '<div role="article" onClick={go}>Go</div>',
      errors: [{ messageId: "notKeyboardAccessible" }],
    },
  ],
});
