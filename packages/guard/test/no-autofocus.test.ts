import rule from "../src/rules/no-autofocus.js";
import { tester } from "./tester.js";

tester.run("jota/no-autofocus", rule, {
  valid: [
    { code: "<input />" },
    { code: "<input autoFocus={false} />" },
    { code: "<Dialog autoFocus />" },
    { code: "<input value={autoFocus} />" },
    { code: "<button>Go</button>" },
  ],
  invalid: [
    { code: "<input autoFocus />", errors: [{ messageId: "autoFocus" }] },
    { code: "<input autoFocus={true} />", errors: [{ messageId: "autoFocus" }] },
    { code: "<input autoFocus={focused} />", errors: [{ messageId: "autoFocus" }] },
    { code: "<input autofocus />", errors: [{ messageId: "autoFocus" }] },
    { code: '<textarea autoFocus="autofocus" />', errors: [{ messageId: "autoFocus" }] },
  ],
});
