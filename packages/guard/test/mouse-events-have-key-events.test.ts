import rule from "../src/rules/mouse-events-have-key-events.js";
import { tester } from "./tester.js";

tester.run("jota/mouse-events-have-key-events", rule, {
  valid: [
    { code: "<div onMouseOver={a} onFocus={b} />" },
    { code: "<div onMouseOut={a} onBlur={b} />" },
    { code: "<div onClick={a} />" },
    { code: "<div onMouseOver={a} {...props} />" },
    { code: "<Tip onMouseOver={a} />" },
  ],
  invalid: [
    {
      code: "<div onMouseOver={a} />",
      errors: [{ messageId: "missingKeyEvent", data: { mouse: "onMouseOver", key: "onFocus" } }],
    },
    {
      code: "<a href='/x' onMouseOut={a}>x</a>",
      errors: [{ messageId: "missingKeyEvent", data: { mouse: "onMouseOut", key: "onBlur" } }],
    },
    { code: "<div onMouseOver={a} onBlur={b} />", errors: [{ messageId: "missingKeyEvent" }] },
    {
      code: "<div onMouseOver={a} onMouseOut={b} />",
      errors: [{ messageId: "missingKeyEvent" }, { messageId: "missingKeyEvent" }],
    },
    { code: "<img onMouseOver={a} alt='' />", errors: [{ messageId: "missingKeyEvent" }] },
  ],
});
