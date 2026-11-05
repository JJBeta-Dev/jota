import rule from "../src/rules/img-alt.js";
import { tester } from "./tester.js";

tester.run("jota/img-alt", rule, {
  valid: [
    { code: '<img src="/a.jpg" alt="Team at the studio" />' },
    { code: '<img src="/divider.svg" alt="" />' },
    { code: "<img src={src} alt={label} />" },
    { code: "<img {...props} />" },
    { code: '<div role="img" aria-label="x" />' },
  ],
  invalid: [
    { code: '<img src="/a.jpg" />', errors: [{ messageId: "missingAlt" }] },
    { code: '<img src="/a.jpg" width={10} height={10} />', errors: [{ messageId: "missingAlt" }] },
    { code: "const a = <img src={x} />;", errors: [{ messageId: "missingAlt" }] },
    { code: '<ul><li><img src="/a.jpg" /></li></ul>', errors: [{ messageId: "missingAlt" }] },
    {
      code: '<><img src="/a.jpg" /><img src="/b.jpg" alt="ok" /></>',
      errors: [{ messageId: "missingAlt" }],
    },
  ],
});
