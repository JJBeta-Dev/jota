import rule from "../src/rules/media-captions.js";
import { tester } from "./tester.js";

tester.run("jota/media-captions", rule, {
  valid: [
    { code: '<video src="/a.mp4"><track kind="captions" src="/a.vtt" srcLang="en" /></video>' },
    { code: '<video muted loop src="/a.mp4" />' },
    { code: '<video {...props} />' },
    { code: '<video><source src="/a.mp4" /><track kind={kind} src="/a.vtt" /></video>' },
    { code: "<audio src='/a.mp3' />" },
  ],
  invalid: [
    { code: '<video src="/a.mp4" />', errors: [{ messageId: "missingCaptions" }] },
    {
      code: '<video controls><source src="/a.mp4" /></video>',
      errors: [{ messageId: "missingCaptions" }],
    },
    {
      code: '<video><track kind="descriptions" src="/d.vtt" /></video>',
      errors: [{ messageId: "missingCaptions" }],
    },
    { code: 'const v = <video src={url} controls />;', errors: [{ messageId: "missingCaptions" }] },
    { code: '<main><video src="/a.mp4" autoPlay /></main>', errors: [{ messageId: "missingCaptions" }] },
  ],
});
