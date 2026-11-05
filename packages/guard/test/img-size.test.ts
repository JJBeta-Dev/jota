import rule from "../src/rules/img-size.js";
import { tester } from "./tester.js";

tester.run("jota/img-size", rule, {
  valid: [
    { code: '<img src="/a.jpg" alt="x" width={800} height={600} />' },
    { code: '<img src="/a.jpg" alt="x" width="800" height="600" />' },
    { code: '<img src="/a.jpg" alt="x" style={{ aspectRatio: "4 / 3" }} />' },
    { code: '<img src="/a.jpg" alt="x" style="aspect-ratio: 4 / 3" />' },
    { code: '<img {...props} alt="x" />' },
    { code: '<picture><source srcSet="a.avif" /></picture>' },
  ],
  invalid: [
    { code: '<img src="/a.jpg" alt="x" />', errors: [{ messageId: "missingSize" }] },
    { code: '<img src="/a.jpg" alt="x" width={800} />', errors: [{ messageId: "missingSize" }] },
    { code: '<img src="/a.jpg" alt="x" height={600} />', errors: [{ messageId: "missingSize" }] },
    {
      code: '<img src="/a.jpg" alt="x" style={{ color: "red" }} />',
      errors: [{ messageId: "missingSize" }],
    },
    { code: "const a = <img src={x} alt={y} />;", errors: [{ messageId: "missingSize" }] },
  ],
});
