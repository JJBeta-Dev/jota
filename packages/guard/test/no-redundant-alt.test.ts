import rule from "../src/rules/no-redundant-alt.js";
import { tester } from "./tester.js";

tester.run("jota/no-redundant-alt", rule, {
  valid: [
    { code: '<img src="/a.jpg" alt="Team working at the studio" />' },
    { code: '<img src="/a.jpg" alt="" />' },
    { code: "<img src='/a.jpg' alt={label} />" },
    { code: '<img src="/a.jpg" alt="Imagery of the coast" />' },
    { code: '<Image alt="Photo of the team" />' },
  ],
  invalid: [
    {
      code: '<img src="/a.jpg" alt="Image of the team" />',
      errors: [{ messageId: "redundantAlt", data: { word: "image" } }],
    },
    { code: '<img src="/a.jpg" alt="A photo of the coast" />', errors: [{ messageId: "redundantAlt" }] },
    { code: '<img src="/a.jpg" alt="Picture" />', errors: [{ messageId: "redundantAlt" }] },
    { code: "<img src='/a.jpg' alt={`Team photo`} />", errors: [{ messageId: "redundantAlt" }] },
    { code: '<img src="/a.jpg" alt="Menu icon" />', errors: [{ messageId: "redundantAlt" }] },
  ],
});
