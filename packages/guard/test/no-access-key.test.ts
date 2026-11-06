import rule from "../src/rules/no-access-key.js";
import { tester } from "./tester.js";

tester.run("jota/no-access-key", rule, {
  valid: [
    { code: "<button>Save</button>" },
    { code: '<a href="/x">x</a>' },
    { code: '<Field accessKey="s" />' },
    { code: "<input key={accessKey} />" },
    { code: "<div tabIndex={0} />" },
  ],
  invalid: [
    { code: '<button accessKey="s">Save</button>', errors: [{ messageId: "accessKey" }] },
    { code: "<a href='/x' accessKey={key}>x</a>", errors: [{ messageId: "accessKey" }] },
    { code: '<input accesskey="n" />', errors: [{ messageId: "accessKey" }] },
    { code: '<div accessKey="d" />', errors: [{ messageId: "accessKey" }] },
    { code: '<textarea accessKey="t" />', errors: [{ messageId: "accessKey" }] },
  ],
});
