import rule from "../src/rules/iframe-title.js";
import { tester } from "./tester.js";

tester.run("jota/iframe-title", rule, {
  valid: [
    { code: '<iframe title="Map of the studio" src="/map" />' },
    { code: "<iframe title={name} src={url} />" },
    { code: '<iframe aria-label="Video" src="/v" />' },
    { code: "<iframe {...props} />" },
    { code: '<Frame src="/x" />' },
  ],
  invalid: [
    { code: '<iframe src="/map" />', errors: [{ messageId: "missingTitle" }] },
    { code: '<iframe title="" src="/map" />', errors: [{ messageId: "missingTitle" }] },
    { code: '<iframe title="  " src="/map" />', errors: [{ messageId: "missingTitle" }] },
    { code: "<iframe title src='/map' />", errors: [{ messageId: "missingTitle" }] },
    { code: "<iframe src={url} />", errors: [{ messageId: "missingTitle" }] },
  ],
});
