import rule from "../src/rules/no-distracting-elements.js";
import { tester } from "./tester.js";

tester.run("jota/no-distracting-elements", rule, {
  valid: [
    { code: "<div>text</div>" },
    { code: "<Marquee>text</Marquee>" },
    { code: '<span className="marquee" />' },
    { code: "<p>blink</p>" },
    { code: "<section />" },
  ],
  invalid: [
    { code: "<marquee>news</marquee>", errors: [{ messageId: "distracting", data: { tag: "marquee" } }] },
    { code: "<blink>sale</blink>", errors: [{ messageId: "distracting", data: { tag: "blink" } }] },
    { code: "<marquee />", errors: [{ messageId: "distracting" }] },
    { code: "<div><blink /></div>", errors: [{ messageId: "distracting" }] },
    { code: "<marquee scrollamount={3}>x</marquee>", errors: [{ messageId: "distracting" }] },
  ],
});
