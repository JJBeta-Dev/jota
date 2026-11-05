import rule from "../src/rules/link-name.js";
import { tester } from "./tester.js";

tester.run("jota/link-name", rule, {
  valid: [
    { code: '<a href="/docs">Docs</a>' },
    { code: '<a href="/docs" aria-label="Documentation"><svg /></a>' },
    { code: '<a href={url}>{label}</a>' },
    { code: '<a href="https://example.com"><img src="/l.svg" alt="Example" /></a>' },
    { code: '<a {...props} />' },
    { code: '<a href="/x"><Icon /></a>' },
    { code: '<Link href="#" />' },
  ],
  invalid: [
    { code: '<a href="/docs" />', errors: [{ messageId: "missingName" }] },
    {
      code: '<a href="#">Open</a>',
      errors: [{ messageId: "invalidHref", data: { href: "#" } }],
    },
    {
      code: '<a href="javascript:void(0)">Open</a>',
      errors: [{ messageId: "invalidHref" }],
    },
    { code: '<a href="">Open</a>', errors: [{ messageId: "invalidHref" }] },
    {
      code: '<a href="#"><svg aria-hidden="true" /></a>',
      errors: [{ messageId: "invalidHref" }, { messageId: "missingName" }],
    },
  ],
});
