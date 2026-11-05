import rule from "../src/rules/no-positive-tabindex.js";
import { tester } from "./tester.js";

tester.run("jota/no-positive-tabindex", rule, {
  valid: [
    { code: "<div tabIndex={0} />" },
    { code: "<div tabIndex={-1} />" },
    { code: '<div tabIndex="0" />' },
    { code: "<div tabIndex={order} />" },
    { code: "<button>No tabindex</button>" },
  ],
  invalid: [
    {
      code: "<div tabIndex={1} />",
      errors: [{ messageId: "positiveTabIndex", data: { value: "1" } }],
    },
    { code: '<input tabIndex="3" />', errors: [{ messageId: "positiveTabIndex" }] },
    { code: "<a href='/x' tabIndex={10}>x</a>", errors: [{ messageId: "positiveTabIndex" }] },
    { code: "<button tabIndex={2}>x</button>", errors: [{ messageId: "positiveTabIndex" }] },
    { code: "<span tabIndex={5} />", errors: [{ messageId: "positiveTabIndex" }] },
  ],
});
