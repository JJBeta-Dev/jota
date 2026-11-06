import rule from "../src/rules/heading-has-content.js";
import { tester } from "./tester.js";

tester.run("jota/heading-has-content", rule, {
  valid: [
    { code: "<h1>Welcome</h1>" },
    { code: "<h2>{title}</h2>" },
    { code: '<h3 aria-label="Section" />' },
    { code: "<h1><Logo /></h1>" },
    { code: "<h4 {...props} />" },
    { code: "<Heading />" },
  ],
  invalid: [
    { code: "<h1></h1>", errors: [{ messageId: "emptyHeading", data: { tag: "h1" } }] },
    { code: "<h2>   </h2>", errors: [{ messageId: "emptyHeading" }] },
    { code: "<h3 />", errors: [{ messageId: "emptyHeading" }] },
    { code: '<h2><img src="/a.png" alt="" /></h2>', errors: [{ messageId: "emptyHeading" }] },
    { code: '<h1><span aria-hidden="true">Hi</span></h1>', errors: [{ messageId: "emptyHeading" }] },
  ],
});
