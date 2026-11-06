import rule from "../src/rules/anchor-ambiguous-text.js";
import { tester } from "./tester.js";

tester.run("jota/anchor-ambiguous-text", rule, {
  valid: [
    { code: '<a href="/pricing">See pricing</a>' },
    { code: '<a href="/x">{label}</a>' },
    { code: '<a href="/x">Read more about Guard</a>' },
    { code: '<a href="/x"><span>here</span></a>' },
    { code: '<a href="/x" />' },
    { code: '<Link href="/x">click here</Link>' },
  ],
  invalid: [
    { code: '<a href="/x">click here</a>', errors: [{ messageId: "ambiguous", data: { text: "click here" } }] },
    { code: '<a href="/x">Read more</a>', errors: [{ messageId: "ambiguous" }] },
    { code: '<a href="/x">  Here.  </a>', errors: [{ messageId: "ambiguous" }] },
    { code: '<a href="/x">Learn more…</a>', errors: [{ messageId: "ambiguous" }] },
    { code: '<a href="/x">link</a>', errors: [{ messageId: "ambiguous" }] },
  ],
});
