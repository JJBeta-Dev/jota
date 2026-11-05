import rule from "../src/rules/heading-order.js";
import { tester } from "./tester.js";

tester.run("jota/heading-order", rule, {
  valid: [
    { code: "<><h1>Title</h1><h2>Section</h2><h3>Part</h3></>" },
    { code: "<><h2>Section</h2><h3>Part</h3></>" },
    { code: "<><h1>Title</h1><h2>A</h2><h2>B</h2><h3>B1</h3><h2>C</h2></>" },
    { code: "<><h3>A</h3><h2>B</h2><h1>C</h1></>" },
    { code: "<div>No headings</div>" },
    { code: "<><h1>Title</h1><Heading level={4} /></>" },
  ],
  invalid: [
    {
      code: "<><h2>A</h2><h4>B</h4></>",
      errors: [{ messageId: "skippedLevel", data: { from: "2", to: "4", next: "3" } }],
    },
    {
      code: "<><h1>A</h1><h3>B</h3></>",
      errors: [{ messageId: "skippedLevel" }],
    },
    {
      code: "<><h1>A</h1><h1>B</h1></>",
      errors: [{ messageId: "multipleH1" }],
    },
    {
      code: "<><h1>A</h1><h2>B</h2><h4>C</h4><h6>D</h6></>",
      errors: [{ messageId: "skippedLevel" }, { messageId: "skippedLevel" }],
    },
    {
      code: "<><h2>A</h2><h4>B</h4><h2>C</h2><h5>D</h5></>",
      errors: [{ messageId: "skippedLevel" }, { messageId: "skippedLevel" }],
    },
  ],
});
